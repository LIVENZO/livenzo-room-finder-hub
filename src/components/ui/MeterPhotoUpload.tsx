import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, Upload } from "lucide-react";
import { takeMeterPhoto, chooseMeterPhotoFromGallery, uploadMeterPhoto } from '@/services/MeterPhotoService';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

interface MeterPhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoUploaded: (photoUrl: string, file: File) => void;
  relationshipId: string;
  renterId: string;
  ownerId: string;
}

export const MeterPhotoUpload: React.FC<MeterPhotoUploadProps> = ({
  isOpen,
  onClose,
  onPhotoUploaded,
  relationshipId,
  renterId,
  ownerId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    try {
      setIsUploading(true);
      const file = await takeMeterPhoto();
      
      if (file) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        
        // Auto-upload immediately after taking photo
        const photoUrl = await uploadMeterPhoto(file, relationshipId, renterId, ownerId);
        if (photoUrl) {
          onPhotoUploaded(photoUrl, file);
          onClose();
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.error('Failed to take photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      setIsUploading(true);
      const file = await chooseMeterPhotoFromGallery();
      
      if (file) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        
        // Auto-upload immediately after selecting photo
        const photoUrl = await uploadMeterPhoto(file, relationshipId, renterId, ownerId);
        if (photoUrl) {
          onPhotoUploaded(photoUrl, file);
          onClose();
        }
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      toast.error('Failed to choose photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4 p-6">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-foreground">
            📸 Upload Meter Photo
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Take a clear photo of your electricity meter reading
          </p>
        </DialogHeader>

        {isUploading ? (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">Uploading meter photo...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Take Photo Button */}
            <Button
              onClick={handleTakePhoto}
              className="w-full h-16 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl flex items-center justify-center gap-4 p-4 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              disabled={isUploading}
            >
              <Camera className="h-8 w-8" />
              <div className="text-left">
                <div className="font-bold text-lg">Take Photo</div>
                <div className="text-sm opacity-90">
                  {isNative ? 'Use your camera' : 'Open camera'}
                </div>
              </div>
            </Button>

            {/* Choose from Gallery Button */}
            <Button
              onClick={handleChooseFromGallery}
              className="w-full h-16 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl flex items-center justify-center gap-4 p-4 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              disabled={isUploading}
            >
              <ImageIcon className="h-8 w-8" />
              <div className="text-left">
                <div className="font-bold text-lg">Choose from Gallery</div>
                <div className="text-sm opacity-90">
                  {isNative ? 'Select from photos' : 'Browse files'}
                </div>
              </div>
            </Button>

            {/* Cancel Button */}
            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full h-12 text-muted-foreground border-border hover:bg-muted/50 rounded-lg"
              disabled={isUploading}
            >
              Cancel
            </Button>

            {/* Info Text */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                📋 Tip: Make sure the meter reading numbers are clearly visible
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};