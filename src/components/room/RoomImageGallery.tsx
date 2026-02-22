
import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface RoomImageGalleryProps {
  images: string[];
  selectedImage: number;
  setSelectedImage: (index: number) => void;
  onImageClick: (index: number) => void;
}

const RoomImageGallery: React.FC<RoomImageGalleryProps> = ({ 
  images, 
  selectedImage, 
  setSelectedImage,
  onImageClick
}) => {
  return (
    <div className="space-y-4">
      <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-lg cursor-pointer" onClick={() => onImageClick(selectedImage)}>
        <img
          src={images[selectedImage]}
          alt={`Room image ${selectedImage + 1}`}
          className="object-cover w-full h-full"
        />
      </AspectRatio>
      
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <div
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`cursor-pointer rounded-md overflow-hidden w-20 h-20 flex-shrink-0 border-2 ${
              selectedImage === index ? 'border-primary' : 'border-transparent'
            }`}
          >
            <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomImageGallery;
