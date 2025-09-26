import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { toast } from "sonner";

interface MeterPhoto {
  id: string;
  photo_url: string;
  photo_name: string;
  billing_month: string;
  created_at: string;
}

interface MeterPhotoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  renterName: string;
  meterPhotos: MeterPhoto[];
  electricityBillAmount?: number;
}

export const MeterPhotoViewModal = ({
  isOpen,
  onClose,
  renterName,
  meterPhotos,
  electricityBillAmount
}: MeterPhotoViewModalProps) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const currentPhoto = meterPhotos[selectedPhotoIndex];

  const handleDownload = async (photo: MeterPhoto) => {
    try {
      const response = await fetch(photo.photo_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = photo.photo_name || `meter-photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Photo downloaded successfully");
    } catch (error) {
      console.error('Error downloading photo:', error);
      toast.error("Failed to download photo");
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleClose = () => {
    resetView();
    onClose();
  };

  if (!currentPhoto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Meter Photos - {renterName}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="text-sm">
                  {new Date(currentPhoto.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Badge>
                {electricityBillAmount && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    Bill: ₹{electricityBillAmount.toLocaleString()}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Photo Display Area */}
        <div className="flex-1 relative overflow-hidden bg-muted/30">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div 
              className="max-w-full max-h-full overflow-hidden rounded-lg shadow-lg bg-white"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease'
              }}
            >
              <img
                src={currentPhoto.photo_url}
                alt="Meter reading"
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: '60vh' }}
              />
            </div>
          </div>

          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomOut}
              className="bg-white/90 hover:bg-white shadow-lg"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomIn}
              className="bg-white/90 hover:bg-white shadow-lg"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleRotate}
              className="bg-white/90 hover:bg-white shadow-lg"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handleDownload(currentPhoto)}
              className="bg-white/90 hover:bg-white shadow-lg"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Multiple Photos Navigation */}
        {meterPhotos.length > 1 && (
          <div className="p-4 border-t">
            <div className="flex gap-2 overflow-x-auto">
              {meterPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setSelectedPhotoIndex(index);
                    resetView();
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedPhotoIndex
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img
                    src={photo.photo_url}
                    alt={`Meter photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            {meterPhotos.length > 1 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Photo {selectedPhotoIndex + 1} of {meterPhotos.length}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleDownload(currentPhoto)}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Photo
          </Button>
          <Button
            onClick={handleClose}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};