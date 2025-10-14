
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
      toast.error('⚠️ Please log in again to upload files');
      return [];
    }
    
    console.log('Authentication validated successfully');
    
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
      toast.error(`⚠️ No valid ${fileType}s to upload. Please ensure files are .jpg, .jpeg, .png, or .webp and under 5MB.`);
      return [];
    }
    
    console.log(`${validFiles.length} valid files ready for upload`);
    
    const uploadedUrls: string[] = [];
    const uploadToastId = toast.loading(`Uploading ${validFiles.length} files...`);
    
    // Test bucket access and permissions
    try {
      console.log('Testing bucket access for:', bucket);
      
      // First, try to list files in the bucket to test access
      const { data: testList, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 });
        
      if (listError) {
        console.error('Bucket access test failed:', listError);
        
        if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
          toast.error(`Storage bucket '${bucket}' does not exist. Please contact support.`, {
            id: uploadToastId,
            duration: 8000
          });
          return [];
        } else if (listError.message.includes('permission') || listError.message.includes('authorized')) {
          toast.error(`No permission to access '${bucket}' bucket. Please contact support.`, {
            id: uploadToastId,
            duration: 8000
          });
          return [];
        } else {
          toast.error(`Bucket access error: ${listError.message}`, {
            id: uploadToastId,
            duration: 8000
          });
          return [];
        }
      }
      
      console.log(`Bucket '${bucket}' access confirmed`);
    } catch (bucketError) {
      console.error('Error during bucket validation:', bucketError);
      toast.error('Storage system error. Please contact support.', {
        id: uploadToastId,
        duration: 5000
      });
      return [];
    }
    
    // Upload each valid file with retry logic
    for (const [index, file] of validFiles.entries()) {
      console.log(`Uploading file ${index + 1}/${validFiles.length}:`, file.name);
      
      toast.loading(`📤 Uploading ${fileType} ${index + 1} of ${validFiles.length}...`, {
        id: uploadToastId
      });
      
      // Sanitize file name and create unique path
      const sanitizedName = sanitizeFileName(file.name);
      const fileExt = sanitizedName.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      console.log('Uploading to bucket:', bucket, 'with path:', filePath);
      
      // Attempt upload with retry logic
      let uploadData = null;
      let uploadError = null;
      let retryCount = 0;
      const maxRetries = 1;
      
      while (retryCount <= maxRetries && !uploadData) {
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount} for file:`, file.name);
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (!error) {
          uploadData = data;
          break;
        }
        
        uploadError = error;
        console.error(`Upload attempt ${retryCount + 1} failed:`, error);
        
        // Handle specific errors
        if (error.message.includes('permissions') || 
            error.message.includes('denied') ||
            error.message.includes('authorized') ||
            error.message.includes('JWT')) {
          toast.error('⚠️ Permission denied. Please log out and log back in.', { id: uploadToastId });
          return uploadedUrls;
        } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          // Generate new filename and try again
          const retryFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 20)}.${fileExt}`;
          const retryFilePath = `${userId}/${retryFileName}`;
          console.log('File exists, retrying with new filename:', retryFilePath);
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucket)
            .upload(retryFilePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (!retryError) {
            uploadData = retryData;
            break;
          }
        }
        
        retryCount++;
      }
      
      // Handle final upload result
      if (!uploadData && uploadError) {
        if (uploadError.message.includes('size')) {
          toast.error(`⚠️ File "${file.name}" is too large. Maximum size is 5MB.`);
        } else if (uploadError.message.includes('type') || uploadError.message.includes('format')) {
          toast.error(`⚠️ File "${file.name}" has invalid format. Only .jpg, .jpeg, .png, and .webp are allowed.`);
        } else {
          console.error('All upload attempts failed:', uploadError);
          toast.error(`⚠️ Failed to upload "${file.name}". Please check your internet connection and try again.`);
        }
        continue;
      }
      
      if (uploadData) {
        console.log('Upload successful, getting public URL for:', uploadData.path);
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path);
        
        if (publicUrlData?.publicUrl) {
          console.log('Public URL generated:', publicUrlData.publicUrl);
          uploadedUrls.push(publicUrlData.publicUrl);
        } else {
          console.error('Failed to generate public URL for:', uploadData.path);
          toast.error('Upload completed but failed to generate file URL. Please contact support.');
        }
      }
    }
    
    toast.dismiss(uploadToastId);
    
    if (uploadedUrls.length > 0) {
      console.log(`Successfully uploaded ${uploadedUrls.length} files`);
      if (fileType === 'image') {
        toast.success(`✅ ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded successfully!`);
      } else {
        toast.success(`✅ ${uploadedUrls.length} document${uploadedUrls.length > 1 ? 's' : ''} uploaded successfully!`);
      }
    } else {
      console.error('No files were successfully uploaded');
      toast.error('⚠️ All uploads failed. Please check your internet connection and try again.');
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Critical error in secure file upload:', error);
    toast.error('⚠️ Something went wrong while uploading. Please check your internet or try again.');
    return [];
  }
};
