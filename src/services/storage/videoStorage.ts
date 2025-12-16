import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_VIDEO_TYPES = ['video/mp4'];

/**
 * Validates a video file for upload
 */
const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid format: ${file.name}. Only MP4 videos are allowed.` };
  }
  
  if (file.size > MAX_VIDEO_SIZE) {
    const sizeMB = Math.round(file.size / (1024 * 1024));
    return { valid: false, error: `${file.name} is ${sizeMB}MB. Maximum size is 100MB.` };
  }
  
  return { valid: true };
};

/**
 * Uploads videos to Supabase storage
 * @param files - Array of video files to upload
 * @param userId - User ID used to organize files in storage
 * @param bucket - Storage bucket name (default: 'rooms')
 * @returns Array of public URLs for the uploaded videos
 */
export const uploadVideosToStorage = async (
  files: File[],
  userId: string,
  bucket: string = 'rooms'
): Promise<string[]> => {
  if (!files || files.length === 0) {
    return [];
  }

  // Validate all files first
  for (const file of files) {
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return [];
    }
  }

  const uploadedUrls: string[] = [];
  const toastId = toast.loading(`Uploading ${files.length} video(s)...`);

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/videos/${timestamp}_${randomSuffix}_${sanitizedFileName}`;

      toast.loading(`Uploading video ${i + 1} of ${files.length}...`, { id: toastId });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error('Video upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`, { id: toastId });
        return uploadedUrls; // Return what we've uploaded so far
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    toast.success(`Successfully uploaded ${uploadedUrls.length} video(s)`, { id: toastId });
    return uploadedUrls;
  } catch (error) {
    console.error('Video upload exception:', error);
    toast.error('Failed to upload videos. Please try again.', { id: toastId });
    return uploadedUrls;
  }
};
