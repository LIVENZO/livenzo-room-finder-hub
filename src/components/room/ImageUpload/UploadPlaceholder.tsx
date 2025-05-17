
import React from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Upload } from 'lucide-react';

interface UploadPlaceholderProps {
  isUploading: boolean;
  disabled: boolean;
  imagesCount: number;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadPlaceholder: React.FC<UploadPlaceholderProps> = ({ 
  isUploading, 
  disabled, 
  imagesCount, 
  onFileSelect 
}) => {
  return (
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
        onChange={onFileSelect}
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
          <span className="text-xs text-gray-400 mt-1">{imagesCount}/5</span>
        </>
      )}
    </label>
  );
};

export default UploadPlaceholder;
