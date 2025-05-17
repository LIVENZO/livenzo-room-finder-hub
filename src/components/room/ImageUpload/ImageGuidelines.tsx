
import React from 'react';

interface ImageGuidelinesProps {
  disabled: boolean;
}

const ImageGuidelines: React.FC<ImageGuidelinesProps> = ({ disabled }) => {
  return (
    <div className="text-xs text-gray-500 space-y-1">
      <p>Upload up to 5 photos of your room. First photo will be used as the main image.</p>
      <p>Maximum file size: 5MB per image. Supported formats: JPEG, PNG, WebP.</p>
      {disabled && (
        <p className="text-amber-600 font-medium">You must be logged in with storage access to upload.</p>
      )}
    </div>
  );
};

export default ImageGuidelines;
