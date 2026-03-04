
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateAuthentication } from '../security/authValidator';
import { validateFiles, sanitizeFileName } from '../security/fileUploadSecurity';
import { compressImages, generateThumbnails } from '@/utils/imageCompression';

/**
 * Upload a single file to storage and return its public URL
 */
const uploadSingleFile = async (
  file: File,
  bucket: string,
  filePath: string
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '31536000', // 1 year cache for immutable assets
      upsert: false,
    });

  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('already exists')) {
      const retryPath = filePath.replace(/(\.\w+)$/, `_${Math.random().toString(36).substring(2, 8)}$1`);
      const { data: retryData, error: retryError } = await supabase.storage
        .from(bucket)
        .upload(retryPath, file, { cacheControl: '31536000', upsert: false });
      if (retryError) return null;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(retryData.path);
      return urlData?.publicUrl || null;
    }
    return null;
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData?.publicUrl || null;
};

/**
 * Securely uploads files to Supabase storage with comprehensive validation
 * For images: compresses to WebP, generates thumbnails, uploads both
 */
export const uploadFilesSecure = async (
  files: File[], 
  userId: string,
  bucket: string = 'rooms',
  fileType: 'image' | 'document' = 'image'
): Promise<string[]> => {
  if (!files.length) return [];
  
  let uploadToastId: string | number | undefined;
  
  try {
    console.log('Starting secure file upload...', { fileCount: files.length, bucket, fileType });
    
    // Validate authentication
    const authResult = await validateAuthentication();
    if (!authResult.isValid || authResult.userId !== userId) {
      toast.error('Please log in again to upload files');
      return [];
    }
    
    // Compress images before validation
    let filesToValidate = files;
    let thumbnailFiles: File[] = [];
    
    if (fileType === 'image') {
      const compressToastId = toast.loading('Optimizing images...');
      try {
        filesToValidate = await compressImages(files);
        thumbnailFiles = await generateThumbnails(filesToValidate);
        toast.dismiss(compressToastId);
      } catch (error: any) {
        toast.error(error.message || 'Unable to process images', { id: compressToastId });
        return [];
      }
    }
    
    // Validate files
    const { validFiles, errors } = validateFiles(filesToValidate, fileType);
    errors.forEach(error => toast.error(error));
    
    if (validFiles.length === 0) {
      toast.error(`No valid ${fileType}s to upload.`);
      return [];
    }
    
    // Test bucket access
    const { error: listError } = await supabase.storage.from(bucket).list('', { limit: 1 });
    if (listError) {
      toast.error(`Storage access error: ${listError.message}`);
      return [];
    }
    
    const uploadedUrls: string[] = [];
    uploadToastId = toast.loading(`Uploading ${validFiles.length} files...`);
    
    for (const [index, file] of validFiles.entries()) {
      toast.loading(`Uploading file ${index + 1} of ${validFiles.length}...`, { id: uploadToastId });
      
      const sanitizedName = sanitizeFileName(file.name);
      const fileExt = sanitizedName.split('.').pop();
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${userId}/${uniqueName}`;
      
      const url = await uploadSingleFile(file, bucket, filePath);
      
      if (url) {
        uploadedUrls.push(url);
        
        // Upload corresponding thumbnail (best effort, don't fail on error)
        if (fileType === 'image' && thumbnailFiles[index]) {
          const thumbPath = `${userId}/thumbs/${uniqueName}`;
          await uploadSingleFile(thumbnailFiles[index], bucket, thumbPath).catch((e) =>
            console.warn('Thumbnail upload failed (non-critical):', e)
          );
        }
      } else {
        console.error('Upload failed for:', file.name);
        if (fileType !== 'image') {
          toast.error(`Failed to upload "${file.name}".`);
        }
      }
    }
    
    if (uploadToastId) toast.dismiss(uploadToastId);
    
    if (uploadedUrls.length > 0) {
      toast.success(`${uploadedUrls.length} ${fileType === 'image' ? 'images' : 'documents'} uploaded!`);
    } else {
      toast.error('All uploads failed. Please check your connection and try again.');
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Critical error in secure file upload:', error);
    toast.error('Upload system error. Please try again.');
    return [];
  }
};
