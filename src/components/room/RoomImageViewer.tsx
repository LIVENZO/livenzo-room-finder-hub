import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface RoomImageViewerProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

const RoomImageViewer: React.FC<RoomImageViewerProps> = ({
  images,
  initialIndex,
  open,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrevious, goToNext, onClose]);

  const handleSwipe = (e: React.TouchEvent) => {
    const touchStart = e.touches[0].clientX;
    const handleTouchEnd = (endEvent: TouchEvent) => {
      const touchEnd = endEvent.changedTouches[0].clientX;
      const diff = touchStart - touchEnd;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToNext();
        } else {
          goToPrevious();
        }
      }
      
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchend', handleTouchEnd);
  };

  // Handle dialog open change - only allow closing, not navigation
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-full h-screen w-screen p-0 bg-black/95 border-none [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Room Image Viewer</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={handleClose}
            type="button"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 z-50 bg-black/50 text-white px-3 py-1 rounded-md text-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Previous Button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={goToPrevious}
              type="button"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Image */}
          <div
            className="w-full h-full flex items-center justify-center"
            onTouchStart={handleSwipe}
          >
            <img
              src={images[currentIndex]}
              alt={`Room image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={goToNext}
              type="button"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-black/50 p-2 rounded-lg">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  type="button"
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    index === currentIndex ? 'border-primary scale-110' : 'border-white/30'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomImageViewer;
