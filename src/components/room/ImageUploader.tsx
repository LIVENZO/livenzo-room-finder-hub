
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { createImagePreviews, revokeImagePreviews } from '@/services/imageUploadService';

interface ImageUploaderProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  images, 
  setImages, 
  uploadedFiles, 
  setUploadedFiles 
}) => {
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Check if we're not exceeding the max number of images
    if (uploadedFiles.length + files.length > 5) {
      toast.error("You can upload maximum 5 images");
      return;
    }

    // Filter out non-image files
    const validImageFiles = Array.from(files).filter(file => {
      if (!file.type.match('image.*')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      return true;
    });

    if (validImageFiles.length === 0) return;

    // Create new arrays to store the updated files and preview URLs
    const newUploadedFiles = [...uploadedFiles, ...validImageFiles];
    
    // Generate preview URLs for the new images
    const newImageUrls = createImagePreviews(validImageFiles);
    const updatedImages = [...images, ...newImageUrls];
    
    // Update state with new files and previews
    setImages(updatedImages);
    setUploadedFiles(newUploadedFiles);
    
    // Reset the file input
    e.target.value = '';
  };

  // Remove an image from the upload list
  const removeImage = (index: number) => {
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
  };

  return (
    <div className="space-y-4">
      <Label className="text-base">Room Photos *</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((image, idx) => (
          <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 border">
            <img 
              src={image} 
              alt={`Room ${idx + 1}`} 
              className="w-full h-full object-cover"
            />
            <button 
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1"
              aria-label="Remove image"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ))}
        
        {images.length < 5 && (
          <label className="border-2 border-dashed rounded-md flex flex-col items-center justify-center aspect-square bg-gray-50 text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
            <Input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              multiple={true}
            />
            <ImagePlus className="h-8 w-8 mb-2 text-gray-400" />
            <span className="text-sm font-medium">Upload Photo</span>
            <span className="text-xs text-gray-400">{images.length}/5</span>
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Upload up to 5 photos of your room. First photo will be used as the main image.
      </p>
    </div>
  );
};

export default ImageUploader;
