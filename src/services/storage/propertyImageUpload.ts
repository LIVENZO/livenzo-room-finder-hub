import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateFiles } from '../security/fileUploadSecurity';

/**
 * Upload property images with automatic retry on failure
 * @param files - Array of image files to upload
 * @param userId - User ID for organizing files
 * @param maxRetries - Maximum number of retry attempts (default: 1)
 * @returns Array of public URLs for uploaded images
 */
export const uploadPropertyImages = async (
  files: File[],
  userId: string,
  maxRetries: number = 1
): Promise<string[]> => {
  if (!files || files.length === 0) {
    throw new Error('No files provided for upload');
  }

  // Validate files
  const { validFiles, errors } = validateFiles(files, 'image');
  
  if (errors.length > 0) {
    errors.forEach(error => toast.error(error));
    throw new Error('File validation failed');
  }

  if (validFiles.length === 0) {
    throw new Error('No valid files to upload');
  }

  const uploadedUrls: string[] = [];
  const bucketName = 'property-images';

  for (const file of validFiles) {
    let uploaded = false;
    let attempts = 0;
    let lastError: Error | null = null;

    while (!uploaded && attempts <= maxRetries) {
      attempts++;
      
      try {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${userId}/${timestamp}_${randomString}_${sanitizedFileName}`;

        console.log(`Uploading property image (attempt ${attempts}/${maxRetries + 1}):`, filePath);

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error(`Upload error (attempt ${attempts}):`, error);
          lastError = error;
          
          if (attempts <= maxRetries) {
            console.log(`Retrying upload for ${file.name}...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            continue;
          }
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        if (!publicUrl) {
          throw new Error('Failed to generate public URL');
        }

        uploadedUrls.push(publicUrl);
        uploaded = true;
        console.log(`Successfully uploaded: ${filePath}`);

      } catch (error) {
        lastError = error as Error;
        if (attempts > maxRetries) {
          console.error(`Failed to upload ${file.name} after ${attempts} attempts:`, error);
          throw new Error(`Failed to upload image: ${file.name}`);
        }
      }
    }

    if (!uploaded && lastError) {
      throw lastError;
    }
  }

  return uploadedUrls;
};

/**
 * Test property-images bucket access
 */
export const testPropertyImagesBucketAccess = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage
      .from('property-images')
      .list('', { limit: 1 });
      
    if (error) {
      console.error('Property images bucket access test failed:', error);
      return false;
    }
    
    console.log('Property images bucket access confirmed');
    return true;
  } catch (error) {
    console.error('Exception testing property images bucket:', error);
    return false;
  }
};
