import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressVideos } from '@/utils/videoCompression';

const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB after compression
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];

/**
 * Uploads videos to Supabase storage with automatic compression
 * Accepts any size video — compresses to 720p H.264 before upload
 */
export const uploadVideosToStorage = async (
  files: File[],
  userId: string,
  bucket: string = 'rooms'
): Promise<string[]> => {
  if (!files || files.length === 0) return [];

  // Validate basic format
  for (const file of files) {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast.error(`${file.name}: Unsupported format. Use MP4, MOV, WebM, or MKV.`);
      return [];
    }
  }

  // Compress videos
  const compressToastId = toast.loading('Compressing videos to 720p HD...');
  let compressedFiles: File[];

  try {
    compressedFiles = await compressVideos(files, (fileIdx, progress) => {
      toast.loading(`Compressing video ${fileIdx + 1}/${files.length}... ${progress}%`, {
        id: compressToastId,
      });
    });
    toast.dismiss(compressToastId);
  } catch (error: any) {
    toast.error(error.message || 'Video compression failed', { id: compressToastId });
    return [];
  }

  if (compressedFiles.length === 0) return [];

  // Check compressed sizes
  for (const file of compressedFiles) {
    if (file.size > MAX_VIDEO_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024));
      toast.error(`${file.name} is still ${sizeMB}MB after compression. Try a shorter video.`);
      return [];
    }
  }

  const uploadedUrls: string[] = [];
  const toastId = toast.loading(`Uploading ${compressedFiles.length} video(s)...`);

  try {
    for (let i = 0; i < compressedFiles.length; i++) {
      const file = compressedFiles[i];
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filePath = `${userId}/videos/${timestamp}_${randomSuffix}.mp4`;

      toast.loading(`Uploading video ${i + 1} of ${compressedFiles.length}...`, { id: toastId });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: false,
          contentType: 'video/mp4',
        });

      if (error) {
        console.error('Video upload error:', error);
        toast.error(`Failed to upload video: ${error.message}`, { id: toastId });
        return uploadedUrls;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    toast.success(`${uploadedUrls.length} video(s) uploaded!`, { id: toastId });
    return uploadedUrls;
  } catch (error) {
    console.error('Video upload exception:', error);
    toast.error('Failed to upload videos. Please try again.', { id: toastId });
    return uploadedUrls;
  }
};
