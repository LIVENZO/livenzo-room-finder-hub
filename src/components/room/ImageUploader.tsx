
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, X, Lock, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createImagePreviews, revokeImagePreviews } from '@/services/imageUploadService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploaderProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  images, 
  setImages, 
  uploadedFiles, 
  setUploadedFiles,
  disabled = false
}) => {
  // Track upload state for UI feedback
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

  return (
    <div className="space-y-4">
      <Label className="text-base">Room Photos {images.length === 0 && '*'}</Label>
      
      {disabled && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to upload images. Your session may have expired.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((image, idx) => (
          <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 border group">
            <img 
              src={image} 
              alt={`Room ${idx + 1}`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
            <button 
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 opacity-70 hover:opacity-100"
              aria-label="Remove image"
              disabled={disabled}
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ))}
        
        {images.length < 5 && (
          <label 
            className={`border-2 border-dashed rounded-md flex flex-col items-center justify-center aspect-square transition-all ${
              isUploading ? 'bg-blue-50 border-blue-300 animate-pulse' :
              disabled 
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400 cursor-pointer text-gray-500'
            }`}
          >
            <Input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              multiple={true}
              disabled={disabled || isUploading}
            />
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 mb-2 text-blue-500 animate-spin" />
                <span className="text-sm font-medium text-blue-700">Uploading...</span>
              </>
            ) : disabled ? (
              <>
                <Lock className="h-8 w-8 mb-2 text-gray-400" />
                <span className="text-sm font-medium">Login Required</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 mb-2 text-gray-400" />
                <span className="text-sm font-medium">Upload Photo</span>
                <span className="text-xs text-gray-400 mt-1">{images.length}/5</span>
              </>
            )}
          </label>
        )}
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>Upload up to 5 photos of your room. First photo will be used as the main image.</p>
        <p>Maximum file size: 5MB per image. Supported formats: JPEG, PNG, WebP.</p>
        {disabled && (
          <p className="text-amber-600 font-medium">You must be logged in with storage access to upload.</p>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
