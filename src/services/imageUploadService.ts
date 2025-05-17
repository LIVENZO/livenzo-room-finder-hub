
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
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  
  try {
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    
    // Log the authentication state
    console.log(`Upload attempt with ${session ? 'authenticated' : 'unauthenticated'} session`);
    console.log(`User ID for upload: ${userId}`);
    
    // Check if user is authenticated
    if (!session) {
      console.error('No active session found. User must be authenticated.');
      toast.error('Authentication required', {
        description: 'Please log in and try again'
      });
      return [];
    }
    
    // Check if the user ID from the session matches the provided user ID
    if (session.user.id !== userId) {
      console.error('Session user ID does not match provided user ID');
      toast.error('Authentication mismatch', {
        description: 'Please refresh the page and try again'
      });
      return [];
    }
    
    // Ensure the bucket exists
    const bucketExists = await ensureBucketExists(bucket);
    
    if (!bucketExists) {
      toast.error('Storage setup failed', {
        description: 'Unable to configure storage. Please try again later'
      });
      return [];
    }
    
    // Filter out files that are too large
    const validFiles = files.filter(file => {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 5MB size limit`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) {
      return [];
    }
    
    // Show toast for upload progress
    const uploadToastId = toast.loading(`Uploading ${validFiles.length} images...`);
    
    // Upload each file
    for (const [index, file] of validFiles.entries()) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Progress indication
      toast.loading(`Uploading image ${index + 1} of ${validFiles.length}`, {
        id: uploadToastId
      });
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Don't overwrite
        });
      
      if (error) {
        console.error('Error uploading file:', error);
        
        if (error.message.includes('permissions') || 
            error.message.includes('denied') ||
            error.message.includes('authorized')) {
          toast.error('Permission denied', {
            description: 'Please log out and log back in'
          });
          toast.dismiss(uploadToastId);
          return uploadedUrls; // Return any successfully uploaded images
        } else {
          toast.error(`Failed to upload ${file.name}`, {
            description: error.message
          });
          continue;
        }
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      if (publicUrlData && publicUrlData.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }
    
    // Dismiss the loading toast and show success
    toast.dismiss(uploadToastId);
    
    if (uploadedUrls.length > 0) {
      toast.success(`${uploadedUrls.length} images uploaded successfully`);
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Error in uploadImagesToStorage:', error);
    toast.error('Upload failed', {
      description: 'An unexpected error occurred'
    });
    return [];
  }
};

/**
 * Ensures the bucket exists, creates it if it doesn't
 * @param bucketName - The name of the bucket to check/create
 * @returns Boolean indicating success
 */
async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (bucketExists) {
      return true;
    }
    
    // Bucket doesn't exist, try to create it
    console.log(`Bucket "${bucketName}" not found, creating it`);
    
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760 // 10MB limit
    });
    
    if (createError) {
      console.error(`Error creating bucket "${bucketName}":`, createError);
      return false;
    }
    
    console.log(`Bucket "${bucketName}" created successfully`);
    
    // Allow time for the bucket to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Error in ensureBucketExists:', error);
    return false;
  }
}

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
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.error('No active session for storage access test');
      return false;
    }
    
    const session = sessionData.session;
    
    // Try to list buckets first as a basic permission test
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return false;
    }
    
    // Check if bucket exists
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    // If bucket doesn't exist, try to create it
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (createError) {
        console.error(`Error creating "${bucketName}" bucket:`, createError);
        return false;
      }
      
      // Allow time for the bucket to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Try to upload a tiny test file to confirm access
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const testFilename = `access-test-${Date.now()}.txt`;
    const testPath = `${session.user.id}/${testFilename}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testContent, { upsert: true });
      
    if (uploadError) {
      console.error('Storage access test upload failed:', uploadError);
      return false;
    }
    
    // Try to get URL for the test file
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .getPublicUrl(testPath);
      
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for test file');
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
