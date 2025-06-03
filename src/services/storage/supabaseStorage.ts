
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
