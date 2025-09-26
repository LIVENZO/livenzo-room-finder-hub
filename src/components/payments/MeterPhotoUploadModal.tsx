import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, User, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const { user } = useAuth();

  const handleUploadPhoto = async () => {
    try {
      setIsUploading(true);
      
      const file = await takeMeterPhoto();
      if (!file) {
        toast.error("Failed to capture photo");
        return;
      }

      const photoUrl = await uploadMeterPhoto(file, relationshipId, user?.id || '', ownerId);
      
      if (photoUrl) {
        setPhotoUploaded(true);
        toast.success("Meter photo uploaded successfully ✅");
        setTimeout(() => {
          onContinue();
        }, 1500);
      } else {
        toast.error("⚠️ Failed to upload. Please try again.");
      }
    } catch (error) {
      console.error('Error uploading meter photo:', error);
      toast.error("⚠️ Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOwnerCalculate = () => {
    onContinue();
  };

  const handleClose = () => {
    setPhotoUploaded(false);
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
          {/* Upload Photo Option */}
          <Card 
            className={`cursor-pointer transition-all border-2 ${
              photoUploaded 
                ? 'border-green-200 bg-green-50' 
                : isUploading 
                ? 'border-blue-200 bg-blue-50' 
                : 'hover:shadow-md hover:border-blue-200'
            }`}
            onClick={!photoUploaded && !isUploading ? handleUploadPhoto : undefined}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    photoUploaded 
                      ? 'bg-green-100' 
                      : isUploading 
                      ? 'bg-blue-100' 
                      : 'bg-blue-100'
                  }`}>
                    {isUploading ? (
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
                        : isUploading 
                        ? 'Uploading meter photo...' 
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
        </div>
      </DialogContent>
    </Dialog>
  );
};