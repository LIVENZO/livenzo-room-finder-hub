
import React, { useCallback, useEffect, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

type MediaItem = { type: 'image'; url: string } | { type: 'video'; url: string };

function buildMediaList(images: string[], videos?: string[]): MediaItem[] {
  const imgs: MediaItem[] = (images || []).map(url => ({ type: 'image', url }));
  const vids: MediaItem[] = (videos || []).map(url => ({ type: 'video', url }));

  // Insert first video at index 2 (3rd slot), second video at end
  const result: MediaItem[] = [];
  let vidIdx = 0;
  for (let i = 0; i < imgs.length; i++) {
    if (i === 2 && vidIdx < vids.length) {
      result.push(vids[vidIdx++]);
    }
    result.push(imgs[i]);
  }
  // Append remaining videos
  while (vidIdx < vids.length) {
    result.push(vids[vidIdx++]);
  }
  return result;
}

interface RoomImageGalleryProps {
  images: string[];
  videos?: string[];
  selectedImage: number;
  setSelectedImage: (index: number) => void;
  onImageClick: (index: number) => void;
}

const RoomImageGallery: React.FC<RoomImageGalleryProps> = ({
  images,
  videos,
  selectedImage,
  setSelectedImage,
  onImageClick,
}) => {
  const mediaItems = buildMediaList(images, videos);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, skipSnaps: false });
  const [current, setCurrent] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrent(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div className="space-y-3">
      {/* Main carousel */}
      <div className="relative group">
        <AspectRatio ratio={16 / 9} className="bg-muted overflow-hidden rounded-xl">
          <div ref={emblaRef} className="h-full overflow-hidden">
            <div className="flex h-full">
              {mediaItems.map((item, idx) => (
                <div key={idx} className="flex-[0_0_100%] min-w-0 h-full">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Room media ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onImageClick(idx)}
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      playsInline
                      preload="metadata"
                      controlsList="nodownload"
                      className="w-full h-full object-contain bg-black"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </AspectRatio>

        {/* Nav arrows */}
        {canPrev && (
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
        )}
        {canNext && (
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        )}

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {mediaItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === current
                  ? 'w-5 bg-white'
                  : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {mediaItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={`cursor-pointer rounded-md overflow-hidden w-20 h-20 flex-shrink-0 border-2 relative ${
              idx === current ? 'border-primary' : 'border-transparent'
            }`}
          >
            {item.type === 'image' ? (
              <img src={item.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-black relative">
                <video src={item.url} preload="metadata" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-4 w-4 text-white fill-white" />
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
