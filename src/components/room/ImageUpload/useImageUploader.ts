
import { useState } from 'react';
import { toast } from 'sonner';
import { createImagePreviews, revokeImagePreviews } from '@/services/imageUploadService';

export function useImageUploader(
  images: string[],
  setImages: React.Dispatch<React.SetStateAction<string[]>>,
  uploadedFiles: File[],
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>,
  disabled: boolean
) {
  const [isUploading, setIsUploading] = useState(false);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      toast.error("Please log in to upload images", {
        description: "You need to be logged in with proper permissions to upload images"
      });
      return;
    }
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);

    // Check if we're not exceeding the max number of images
    if (uploadedFiles.length + files.length > 5) {
      toast.error("Maximum 5 images allowed", {
        description: `You already have ${uploadedFiles.length} images selected`
      });
      setIsUploading(false);
      return;
    }

    // Filter out non-image files and files larger than 5MB
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const validImageFiles = Array.from(files).filter(file => {
      if (!file.type.match('image.*')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds the 5MB size limit`);
        return false;
      }
      
      return true;
    });

    if (validImageFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    try {
      // Create new arrays to store the updated files and preview URLs
      const newUploadedFiles = [...uploadedFiles, ...validImageFiles];
      
      // Generate preview URLs for the new images
      const newImageUrls = createImagePreviews(validImageFiles);
      const updatedImages = [...images, ...newImageUrls];
      
      // Update state with new files and previews
      setImages(updatedImages);
      setUploadedFiles(newUploadedFiles);
      
      // Show success toast if multiple images were added
      if (validImageFiles.length > 1) {
        toast.success(`${validImageFiles.length} images added successfully`);
      }
    } catch (error) {
      console.error("Error processing image upload:", error);
      toast.error("Failed to process images");
    } finally {
      setIsUploading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  // Remove an image from the upload list
  const removeImage = (index: number) => {
    if (disabled) return;
    
    const newImages = [...images];
    const newUploadedFiles = [...uploadedFiles];
    
    // Release the object URL to avoid memory leaks if it's a blob URL
    if (newImages[index].startsWith('blob:')) {
      revokeImagePreviews([newImages[index]]);
    }
    
    newImages.splice(index, 1);
    newUploadedFiles.splice(index, 1);
    
    setImages(newImages);
    setUploadedFiles(newUploadedFiles);
    toast.info("Image removed");
  };

  return {
    isUploading,
    handleImageUpload,
    removeImage
  };
}
