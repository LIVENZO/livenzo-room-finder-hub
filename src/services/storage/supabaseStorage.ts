
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadFilesSecure } from './secureStorage';

/**
 * Uploads images to Supabase storage with security validation
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
  // Use the secure upload service
  const fileType = bucket === 'documents' ? 'document' : 'image';
  return uploadFilesSecure(files, userId, bucket, fileType);
};

/**
 * Test storage bucket access and permissions
 */
export const testStorageBucketAccess = async (bucket: string): Promise<boolean> => {
  try {
    console.log(`Testing access to bucket: ${bucket}`);
    
    // Test bucket access by listing files
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { limit: 1 });
      
    if (error) {
      console.error(`Bucket access test failed for ${bucket}:`, error);
      return false;
    }
    
    console.log(`Bucket ${bucket} access confirmed`);
    return true;
  } catch (error) {
    console.error(`Exception testing bucket ${bucket}:`, error);
    return false;
  }
};

/**
 * Get storage bucket info
 */
export const getStorageBucketInfo = async (bucket: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { limit: 1 });
      
    if (error) {
      return { exists: false, error: error.message };
    }
    
    return { exists: true, accessible: true };
  } catch (error) {
    return { exists: false, error: 'Unknown error' };
  }
};
