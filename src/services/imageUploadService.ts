
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
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    
    // Check if user is authenticated (except for guest users which should be handled separately)
    if (!session && userId !== 'guest') {
      console.error('No active session found. User must be authenticated.');
      toast.error('Authentication required. Please log in and try again.');
      return [];
    }
    
    // Log the current authentication state
    console.log(`Upload attempt with ${session ? 'authenticated' : 'unauthenticated'} session`);
    console.log(`User ID for upload: ${userId}`);
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      
      if (bucketsError.message.includes('not authorized') || bucketsError.message.includes('permission denied')) {
        toast.error('Storage access denied. Please check if you are logged in.');
      } else {
        toast.error('Unable to access storage. Please try again later.');
      }
      
      return [];
    }
    
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      console.log(`Bucket "${bucket}" does not exist, attempting to create it`);
      
      // Try to create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (createError) {
        console.error(`Error creating "${bucket}" bucket:`, createError);
        
        if (createError.message.includes('row-level security') || 
            createError.message.includes('permission denied') ||
            createError.message.includes('not authorized')) {
          toast.error('Storage access denied. Please make sure you are logged in with the right permissions.');
        } else {
          toast.error('Unable to configure storage. Please try again later.');
        }
        
        return [];
      }
      
      // Set bucket to public
      await supabase.storage.updateBucket(bucket, { public: true });
    }

    // Log upload attempt
    console.log(`Uploading ${files.length} files to ${bucket} bucket for user ${userId}`);
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${userId || 'guest'}/${fileName}`;
      
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
        
        if (error.message.includes('row-level security') || 
            error.message.includes('permission denied') ||
            error.message.includes('not authorized')) {
          toast.error('Access denied. Make sure you are logged in with the right account.');
        } else if (error.message.includes('size exceeds')) {
          toast.error(`File "${file.name}" exceeds the maximum size limit.`);
        } else {
          toast.error(`Failed to upload ${file.name}`);
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
