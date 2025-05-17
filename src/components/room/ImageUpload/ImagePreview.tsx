
import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewProps {
  image: string;
  index: number;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  image, 
  index, 
  onRemove, 
  disabled = false 
}) => {
  return (
    <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100 border group">
      <img 
        src={image} 
        alt={`Room ${index + 1}`} 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
      <button 
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 opacity-70 hover:opacity-100"
        aria-label="Remove image"
        disabled={disabled}
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </div>
  );
};

export default ImagePreview;
