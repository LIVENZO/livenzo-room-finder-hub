
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
    console.log('Starting secure file upload...', { 
      fileCount: files.length, 
      bucket, 
      fileType,
      userId 
    });
    
    // Validate authentication
    const authResult = await validateAuthentication();
    if (!authResult.isValid || authResult.userId !== userId) {
      console.error('Authentication validation failed:', authResult);
      toast.error('Authentication required for file upload');
      return [];
    }
    
    // Validate files
    const { validFiles, errors } = validateFiles(files, fileType);
    
    if (errors.length > 0) {
      errors.forEach(error => {
        console.error('File validation error:', error);
        toast.error(error);
      });
    }
    
    if (validFiles.length === 0) {
      console.error('No valid files to upload');
      return [];
    }
    
    const uploadedUrls: string[] = [];
    const uploadToastId = toast.loading(`Uploading ${validFiles.length} files...`);
    
    // Upload each valid file
    for (const [index, file] of validFiles.entries()) {
      console.log(`Uploading file ${index + 1}/${validFiles.length}:`, file.name);
      
      toast.loading(`Uploading file ${index + 1} of ${validFiles.length}`, {
        id: uploadToastId
      });
      
      // Sanitize file name and create unique path
      const sanitizedName = sanitizeFileName(file.name);
      const fileExt = sanitizedName.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = bucket === 'user-uploads' ? `avatars/${userId}/${fileName}` : `${userId}/${fileName}`;
      
      console.log('Uploading to path:', filePath);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Supabase storage upload error:', error);
        
        if (error.message.includes('permissions') || 
            error.message.includes('denied') ||
            error.message.includes('authorized')) {
          toast.error('Permission denied for file upload. Please check your account settings.');
          break;
        } else if (error.message.includes('size')) {
          toast.error('File size too large. Please use a smaller image (max 5MB).');
          continue;
        } else if (error.message.includes('type') || error.message.includes('format')) {
          toast.error('Invalid file type. Please use JPG, PNG, or WebP format.');
          continue;
        } else {
          toast.error(`Failed to upload ${file.name}. Please try again.`);
          continue;
        }
      }
      
      if (data) {
        console.log('Upload successful, getting public URL for:', data.path);
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        
        if (publicUrlData?.publicUrl) {
          console.log('Public URL generated:', publicUrlData.publicUrl);
          uploadedUrls.push(publicUrlData.publicUrl);
        } else {
          console.error('Failed to generate public URL');
          toast.error('Upload completed but failed to generate public URL');
        }
      }
    }
    
    toast.dismiss(uploadToastId);
    
    if (uploadedUrls.length > 0) {
      console.log(`Successfully uploaded ${uploadedUrls.length} files`);
      if (fileType === 'image' && bucket === 'user-uploads') {
        // Don't show success toast for profile pictures - handled by the calling component
      } else {
        toast.success(`${uploadedUrls.length} files uploaded successfully`);
      }
    } else {
      console.error('No files were successfully uploaded');
      toast.error('Upload failed. Please try a different image or check your internet connection.');
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Error in secure file upload:', error);
    toast.error('Upload failed due to a technical issue. Please try again.');
    return [];
  }
};
