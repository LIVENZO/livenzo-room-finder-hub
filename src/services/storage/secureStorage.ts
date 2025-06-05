
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
      toast.error('Please log in again to upload images');
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
      toast.error('No valid images to upload. Please check file format and size.');
      return [];
    }
    
    console.log(`${validFiles.length} valid files ready for upload`);
    
    const uploadedUrls: string[] = [];
    const uploadToastId = toast.loading(`Uploading ${validFiles.length} files...`);
    
    // Enhanced bucket existence check
    try {
      console.log('Checking bucket access...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        toast.error('Unable to access storage system. Please try again later.', {
          id: uploadToastId,
          duration: 5000
        });
        return [];
      }
      
      console.log('Available buckets:', buckets?.map(b => b.name));
      const bucketExists = buckets?.some(b => b.name === bucket);
      
      if (!bucketExists) {
        console.error(`Storage bucket '${bucket}' not found. Available buckets:`, buckets?.map(b => b.name));
        toast.error(`Storage bucket '${bucket}' is not available. Please contact support.`, {
          id: uploadToastId,
          duration: 8000
        });
        return [];
      }
      
      console.log(`Bucket '${bucket}' confirmed to exist and is accessible`);
      
      // Test write permission by trying to list files in the bucket
      const { data: testList, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 });
        
      if (listError) {
        console.error('Bucket permission test failed:', listError);
        toast.error('No permission to access storage bucket. Please contact support.', {
          id: uploadToastId,
          duration: 8000
        });
        return [];
      }
      
      console.log('Bucket permissions verified');
    } catch (bucketCheckError) {
      console.error('Error during bucket validation:', bucketCheckError);
      toast.error('Storage system error. Please try again or contact support.', {
        id: uploadToastId,
        duration: 5000
      });
      return [];
    }
    
    // Upload each valid file
    for (const [index, file] of validFiles.entries()) {
      console.log(`Uploading file ${index + 1}/${validFiles.length}:`, file.name);
      
      toast.loading(`Uploading file ${index + 1} of ${validFiles.length}...`, {
        id: uploadToastId
      });
      
      // Sanitize file name and create unique path
      const sanitizedName = sanitizeFileName(file.name);
      const fileExt = sanitizedName.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = bucket === 'user-uploads' ? `avatars/${userId}/${fileName}` : `${userId}/${fileName}`;
      
      console.log('Uploading to bucket:', bucket, 'with path:', filePath);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      let uploadData = data;
      
      if (error) {
        console.error('Supabase storage upload error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        if (error.message.includes('permissions') || 
            error.message.includes('denied') ||
            error.message.includes('authorized') ||
            error.message.includes('JWT')) {
          toast.error('Permission denied. Please log out and log back in.', { id: uploadToastId });
          break;
        } else if (error.message.includes('size')) {
          toast.error(`File "${file.name}" is too large. Maximum size is 5MB.`);
          continue;
        } else if (error.message.includes('type') || error.message.includes('format')) {
          toast.error(`File "${file.name}" has invalid format. Use JPG, PNG, or WebP.`);
          continue;
        } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          // File with same name exists, try with different name
          const retryFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 20)}.${fileExt}`;
          const retryFilePath = bucket === 'user-uploads' ? `avatars/${userId}/${retryFileName}` : `${userId}/${retryFileName}`;
          console.log('Retrying upload with new filename:', retryFilePath);
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucket)
            .upload(retryFilePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (retryError) {
            console.error('Retry upload failed:', retryError);
            toast.error(`Failed to upload "${file.name}". Please try again.`);
            continue;
          } else {
            uploadData = retryData;
          }
        } else {
          console.error('Unknown upload error:', error.message);
          toast.error(`Upload failed: ${error.message}. Please contact support if this persists.`);
          continue;
        }
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
          toast.error('Upload completed but failed to generate image URL. Please contact support.');
        }
      }
    }
    
    toast.dismiss(uploadToastId);
    
    if (uploadedUrls.length > 0) {
      console.log(`Successfully uploaded ${uploadedUrls.length} files`);
      if (fileType === 'image' && bucket !== 'user-uploads') {
        toast.success(`${uploadedUrls.length} images uploaded successfully!`);
      }
    } else {
      console.error('No files were successfully uploaded');
      toast.error('All uploads failed. Please check your internet connection and try again.');
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Critical error in secure file upload:', error);
    toast.error('Upload system error. Please contact support if this persists.');
    return [];
  }
};
