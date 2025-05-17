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
    
    // Create the bucket if it doesn't exist
    const { error: bucketError } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10485760 // 10MB limit
    });
    
    // If there's an error and it's not because the bucket already exists, show an error
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating bucket:', bucketError);
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

// This function is no longer needed since we're creating buckets directly in the upload function
// but we'll keep it here in case it's used elsewhere in the code
async function ensureBucketExists(bucketName: string): Promise<boolean> {
  try {
    // Create the bucket directly (Supabase will handle if it already exists)
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760 // 10MB limit
    });
    
    // If there's an error and it's not because the bucket already exists, return false
    if (error && !error.message.includes('already exists')) {
      console.error(`Error creating bucket "${bucketName}":`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureBucketExists:', error);
    return false;
  }
}
