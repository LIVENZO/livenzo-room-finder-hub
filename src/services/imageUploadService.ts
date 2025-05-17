
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
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      toast.error('Authentication error. Please log in again.');
      return [];
    }
    
    const session = sessionData.session;
    
    // Check if user is authenticated (except for guest users which should be handled separately)
    if (!session && userId !== 'guest') {
      console.error('No active session found. User must be authenticated.');
      toast.error('Authentication required. Please log in and try again.');
      return [];
    }
    
    // Ensure we use the authenticated user ID when available
    const effectiveUserId = session?.user?.id || userId;
    
    // Log the current authentication state
    console.log(`Upload attempt with ${session ? 'authenticated' : 'unauthenticated'} session`);
    console.log(`User ID for upload: ${effectiveUserId}`);
    
    // Check if bucket exists and create it if it doesn't
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
      const { error: updateError } = await supabase.storage.updateBucket(bucket, { public: true });
      if (updateError) {
        console.error(`Error updating "${bucket}" bucket to public:`, updateError);
      } else {
        console.log(`Successfully set "${bucket}" bucket to public`);
      }
    }

    // Log upload attempt
    console.log(`Uploading ${files.length} files to ${bucket} bucket for user ${effectiveUserId}`);
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${effectiveUserId}/${fileName}`;
      
      console.log(`Uploading file: ${file.name} as ${filePath}`);
      
      // Upload the file to Supabase Storage with the authenticated session
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
          toast.error('Storage access denied. Please make sure you are logged in.');
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

/**
 * Tests if the storage service is accessible with current session
 * @param bucketName - The bucket name to test access for
 * @returns A boolean indicating whether storage is accessible
 */
export const testStorageAccess = async (bucketName: string = 'rooms'): Promise<boolean> => {
  try {
    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('No active session for storage access test');
      return false;
    }
    
    const session = sessionData.session;
    const userId = session.user.id;
    
    // Try to upload a tiny test file to confirm access
    const testPath = `${userId}/access-test-${Date.now()}.txt`;
    const testContent = new Blob(['test'], { type: 'text/plain' });
    
    // Check bucket existence first
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return false;
    }
    
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (createError) {
        console.error(`Error creating "${bucketName}" bucket:`, createError);
        return false;
      }
    }
    
    // Test upload
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testContent, { upsert: true });
      
    if (uploadError) {
      console.error('Storage access test failed:', uploadError);
      return false;
    }
    
    // Cleanup test file
    await supabase.storage.from(bucketName).remove([testPath]);
    
    console.log('Storage access test successful');
    return true;
  } catch (error) {
    console.error('Storage access test error:', error);
    return false;
  }
};
