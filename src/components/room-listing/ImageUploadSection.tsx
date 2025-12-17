import React from 'react';
import { FormLabel, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploadSectionProps {
  imageFiles: File[];
  imagePreviews: string[];
  existingImages?: string[];
  isSubmitting: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  imageFiles,
  imagePreviews,
  existingImages = [],
  isSubmitting,
  onImageChange,
  onRemoveImage,
}) => {
  // Total count for limit checks (existing + new files)
  const totalImages = existingImages.length + imageFiles.length;
  // All previews to display (existing URLs + new file previews)
  const allPreviews = [...existingImages, ...imagePreviews.slice(existingImages.length)];

  return (
    <div className="space-y-2">
      <FormLabel>Room Images</FormLabel>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          onChange={onImageChange}
          className="hidden"
          id="image-upload"
          disabled={totalImages >= 5 || isSubmitting}
        />
        
        {allPreviews.length === 0 ? (
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <UploadCloud className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">Click to upload (max 5 images)</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG/JPEG, WEBP up to 5MB each</p>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {allPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => onRemoveImage(index)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {totalImages < 5 && (
              <label
                htmlFor="image-upload"
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                <span>Add more images ({5 - totalImages} remaining)</span>
              </label>
            )}
          </div>
        )}
      </div>
      <FormDescription>
        Upload up to 5 high-quality images of your room
      </FormDescription>
      {totalImages === 0 && (
        <p className="text-sm text-destructive">
          At least one image is required
        </p>
      )}
    </div>
  );
};

export default ImageUploadSection;
