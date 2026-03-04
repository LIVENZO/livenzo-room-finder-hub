
import React, { useCallback, useEffect, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

type MediaItem = { type: 'image'; src: string } | { type: 'video'; src: string };

interface RoomImageGalleryProps {
  images: string[];
  selectedImage: number;
  setSelectedImage: (index: number) => void;
  onImageClick: (index: number) => void;
  videos?: string[];
}

/**
 * Interleave images and videos: img, img, video, img, img, video…
 */
function buildMediaList(images: string[], videos: string[]): MediaItem[] {
  const items: MediaItem[] = [];
  let imgIdx = 0;
  let vidIdx = 0;

  while (imgIdx < images.length || vidIdx < videos.length) {
    // Two images
    for (let i = 0; i < 2 && imgIdx < images.length; i++) {
      items.push({ type: 'image', src: images[imgIdx++] });
    }
    // One video
    if (vidIdx < videos.length) {
      items.push({ type: 'video', src: videos[vidIdx++] });
    }
  }
  return items;
}

const RoomImageGallery: React.FC<RoomImageGalleryProps> = ({
  images,
  selectedImage,
  setSelectedImage,
  onImageClick,
  videos = [],
}) => {
  const mediaItems = buildMediaList(images, videos);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, dragFree: false });
  const [currentIndex, setCurrentIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  const canScrollPrev = emblaApi?.canScrollPrev() ?? false;
  const canScrollNext = emblaApi?.canScrollNext() ?? false;

  return (
    <div className="space-y-3">
      {/* Main carousel */}
      <div className="relative group">
        <div className="overflow-hidden rounded-xl" ref={emblaRef}>
          <div className="flex">
            {mediaItems.map((item, idx) => (
              <div key={idx} className="flex-[0_0_100%] min-w-0">
                <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-xl">
                  {item.type === 'image' ? (
                    <img
                      src={item.src}
                      alt={`Room media ${idx + 1}`}
                      className="object-cover w-full h-full cursor-pointer"
                      onClick={() => onImageClick(idx)}
                    />
                  ) : (
                    <video
                      src={item.src}
                      controls
                      controlsList="nodownload"
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover bg-black"
                    />
                  )}
                </AspectRatio>
              </div>
            ))}
          </div>
        </div>

        {/* Nav arrows */}
        {canScrollPrev && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        {canScrollNext && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        )}

        {/* Counter pill */}
        <div className="absolute bottom-3 right-3 bg-background/70 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full">
          {currentIndex + 1} / {mediaItems.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {mediaItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => scrollTo(idx)}
            className={`relative cursor-pointer rounded-md overflow-hidden w-20 h-20 flex-shrink-0 border-2 transition-colors ${
              currentIndex === idx ? 'border-primary' : 'border-transparent'
            }`}
          >
            {item.type === 'image' ? (
              <img src={item.src} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-black relative">
                <video src={item.src} preload="metadata" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-5 w-5 text-white fill-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomImageGallery;
