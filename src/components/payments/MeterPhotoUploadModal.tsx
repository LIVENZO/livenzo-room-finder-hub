import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, User, CheckCircle, Loader2, X, RotateCcw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";
import { uploadMeterPhoto, takeMeterPhoto } from "@/services/MeterPhotoService";

interface MeterPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  relationshipId: string;
  ownerId: string;
}

export const MeterPhotoUploadModal = ({ 
  isOpen, 
  onClose, 
  onContinue,
  relationshipId,
  ownerId
}: MeterPhotoUploadModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const { user } = useAuth();

  const handleTakePhoto = async () => {
    try {
      setShowCamera(true);
      
      const file = await takeMeterPhoto();
      if (!file) {
        toast.error("⚠️ Camera access is required to upload meter photos. Please enable it in settings.");
        setShowCamera(false);
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCapturedPhoto(file);
      setPhotoPreview(previewUrl);
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.error("⚠️ Camera access is required to upload meter photos. Please enable it in settings.");
      setShowCamera(false);
    }
  };

  const handleRetakePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setCapturedPhoto(null);
    setPhotoPreview(null);
    setUploadProgress(0);
  };

  const handleUploadPhoto = async () => {
    if (!capturedPhoto) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 20;
        });
      }, 200);

      const photoUrl = await uploadMeterPhoto(capturedPhoto, relationshipId, user?.id || '', ownerId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (photoUrl) {
        setPhotoUploaded(true);
        toast.success("Meter photo uploaded successfully ✅");
        setTimeout(() => {
          onContinue();
        }, 1500);
      } else {
        toast.error("⚠️ Upload failed. Please check your network and try again.");
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Error uploading meter photo:', error);
      toast.error("⚠️ Upload failed. Please check your network and try again.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOwnerCalculate = () => {
    onContinue();
  };

  const handleClose = () => {
    // Clean up state
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoUploaded(false);
    setCapturedPhoto(null);
    setPhotoPreview(null);
    setUploadProgress(0);
    setShowCamera(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Electricity Bill Calculation</DialogTitle>
          <DialogDescription>
            Choose how to handle your electricity charges
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Preview Screen */}
          {photoPreview && !photoUploaded ? (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={photoPreview} 
                  alt="Meter photo preview" 
                  className="w-full h-64 object-cover rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading meter photo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRetakePhoto}
                  className="flex-1"
                  disabled={isUploading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={handleUploadPhoto}
                  className="flex-1 bg-primary"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>
              </div>
            </div>
          ) : (
            // Main Options Screen
            <>
              {/* Upload Photo Option */}
              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  photoUploaded 
                    ? 'border-green-200 bg-green-50' 
                    : showCamera 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'hover:shadow-md hover:border-blue-200'
                }`}
                onClick={!photoUploaded && !showCamera ? handleTakePhoto : undefined}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        photoUploaded 
                          ? 'bg-green-100' 
                          : showCamera 
                          ? 'bg-blue-100' 
                          : 'bg-blue-100'
                      }`}>
                        {showCamera ? (
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        ) : photoUploaded ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Camera className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {photoUploaded ? 'Photo Uploaded' : 'Upload Photo'}
                          </h3>
                          {photoUploaded && (
                            <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {photoUploaded 
                            ? 'Meter photo saved successfully' 
                            : showCamera 
                            ? 'Opening camera...' 
                            : 'Capture and upload your meter reading'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Owner Calculate Option */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-200"
                onClick={handleOwnerCalculate}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Owner Calculate</h3>
                        <p className="text-sm text-muted-foreground">
                          Let your owner calculate electricity charges
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button variant="outline" onClick={handleClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};