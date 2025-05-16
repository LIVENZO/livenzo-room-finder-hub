
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Uploads images to Supabase storage and returns their public URLs
 * @param files - Array of files to upload
 * @param userId - User ID used to organize files in storage
 * @param bucket - Storage bucket name (default: 'rooms')
 * @returns Array of public URLs for the uploaded images
 */
export const uploadImagesToStorage = async (
  files: File[], 
  userId: string,
  bucket: string = 'rooms'
): Promise<string[]> => {
  if (!files.length) return [];
  
  const uploadedUrls: string[] = [];
  
  try {
    // Check if bucket exists, if not log a clear error
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      console.error(`Bucket "${bucket}" does not exist in Supabase storage`);
      toast.error(`Storage configuration issue. Please contact support.`);
      return [];
    }

    console.log(`Uploading ${files.length} files to ${bucket} bucket for user ${userId}`);
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${userId ? userId : 'guest'}/${fileName}`;
      
      console.log(`Uploading file: ${file.name} as ${filePath}`);
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      
      if (error) {
        console.error('Error uploading file to Supabase:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      if (publicUrlData && publicUrlData.publicUrl) {
        console.log(`File uploaded successfully: ${publicUrlData.publicUrl}`);
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Error in uploadImagesToStorage:', error);
    toast.error('An unexpected error occurred during file upload');
    return [];
  }
};

/**
 * Creates object URLs from an array of files for preview purposes
 * @param files - Array of files to create preview URLs for
 * @returns Array of object URLs
 */
export const createImagePreviews = (files: File[]): string[] => {
  return Array.from(files).map(file => URL.createObjectURL(file));
};

/**
 * Revokes object URLs to avoid memory leaks
 * @param urls - Array of object URLs to revoke
 */
export const revokeImagePreviews = (urls: string[]): void => {
  urls.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
};
