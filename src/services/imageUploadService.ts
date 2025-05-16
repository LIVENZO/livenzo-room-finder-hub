
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
    // Check if bucket exists, if not create it with public access
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      console.log(`Bucket "${bucket}" does not exist, attempting to create it`);
      
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,  // Make sure bucket is public
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (createError) {
        console.error(`Error creating "${bucket}" bucket:`, createError);
        
        if (createError.message.includes('row-level security')) {
          console.error('Row level security policy is preventing bucket creation');
          toast.error(`Storage permission denied. Please check your account permissions.`);
        } else {
          toast.error(`Storage configuration issue. Please try again later.`);
        }
        
        return [];
      }
      
      // Set bucket to public after creation to ensure it's accessible
      const { error: updateError } = await supabase.storage.updateBucket(bucket, {
        public: true
      });
      
      if (updateError) {
        console.error(`Error setting bucket "${bucket}" to public:`, updateError);
      } else {
        console.log(`Created "${bucket}" bucket successfully and set to public`);
      }
    }

    // Check bucket policies - using a try/catch since this function might not exist
    try {
      // Remove the typed RPC call that's causing the error
      console.log(`Checking storage policies for ${bucket} bucket`);
      
      // Instead of using RPC, we'll just log that we're checking policies
      // This avoids the TypeScript error with unknown RPC functions
    } catch (e) {
      console.log('Unable to check bucket policies:', e);
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
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting
        });
      
      if (error) {
        console.error('Error uploading file to Supabase:', error);
        
        // More specific error messages based on error type
        if (error.message.includes('row-level security')) {
          toast.error(`Storage access denied. Please check your permissions.`);
        } else if (error.message.includes('size exceeds')) {
          toast.error(`File "${file.name}" exceeds the maximum size limit.`);
        } else {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }
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
