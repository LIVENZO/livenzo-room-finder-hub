
import React from 'react';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImagePreview from './ImageUpload/ImagePreview';
import UploadPlaceholder from './ImageUpload/UploadPlaceholder';
import ImageGuidelines from './ImageUpload/ImageGuidelines';
import { useImageUploader } from './ImageUpload/useImageUploader';

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
  const { isUploading, handleImageUpload, removeImage } = useImageUploader(
    images,
    setImages,
    uploadedFiles,
    setUploadedFiles,
    disabled
  );

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
          <ImagePreview
            key={idx}
            image={image}
            index={idx}
            onRemove={removeImage}
            disabled={disabled}
          />
        ))}
        
        {images.length < 5 && (
          <UploadPlaceholder
            isUploading={isUploading}
            disabled={disabled}
            imagesCount={images.length}
            onFileSelect={handleImageUpload}
          />
        )}
      </div>
      
      <ImageGuidelines disabled={disabled} />
    </div>
  );
};

export default ImageUploader;
