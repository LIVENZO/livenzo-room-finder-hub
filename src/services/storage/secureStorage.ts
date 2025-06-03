
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateAuthentication } from '../security/authValidator';
import { validateFiles, sanitizeFileName } from '../security/fileUploadSecurity';

/**
 * Securely uploads files to Supabase storage with comprehensive validation
 */
export const uploadFilesSecure = async (
  files: File[], 
  userId: string,
  bucket: string = 'rooms',
  fileType: 'image' | 'document' = 'image'
): Promise<string[]> => {
  if (!files.length) return [];
  
  try {
    // Validate authentication
    const authResult = await validateAuthentication();
    if (!authResult.isValid || authResult.userId !== userId) {
      toast.error('Authentication required for file upload');
      return [];
    }
    
    // Validate files
    const { validFiles, errors } = validateFiles(files, fileType);
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }
    
    if (validFiles.length === 0) {
      return [];
    }
    
    const uploadedUrls: string[] = [];
    const uploadToastId = toast.loading(`Uploading ${validFiles.length} files...`);
    
    // Upload each valid file
    for (const [index, file] of validFiles.entries()) {
      toast.loading(`Uploading file ${index + 1} of ${validFiles.length}`, {
        id: uploadToastId
      });
      
      // Sanitize file name and create unique path
      const sanitizedName = sanitizeFileName(file.name);
      const fileExt = sanitizedName.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading file:', error);
        
        if (error.message.includes('permissions') || 
            error.message.includes('denied') ||
            error.message.includes('authorized')) {
          toast.error('Permission denied for file upload');
          break;
        } else {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }
    
    toast.dismiss(uploadToastId);
    
    if (uploadedUrls.length > 0) {
      toast.success(`${uploadedUrls.length} files uploaded successfully`);
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Error in secure file upload:', error);
    toast.error('Upload failed due to security validation');
    return [];
  }
};
