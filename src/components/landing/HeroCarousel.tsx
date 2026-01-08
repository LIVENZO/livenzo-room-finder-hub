import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

const CAROUSEL_IMAGES = [
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1766131737442_0ozzpm685nw.jpg',
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1766131738562_bd30txo9bd.jpg',
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1767528319032_j7mjrqzq9ol.jpg',
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1766132019346_v39iyaqqgs.jpg',
  'https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1767873415838_ncg44uvhnsj.jpg',
];

const HeroCarousel: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-slide every 3.5 seconds
  useEffect(() => {
    if (!emblaApi) return;
    
    const autoSlide = setInterval(() => {
      emblaApi.scrollNext();
    }, 3500);

    return () => clearInterval(autoSlide);
  }, [emblaApi]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={emblaRef} className="h-full">
        <div className="flex h-full">
          {CAROUSEL_IMAGES.map((imageUrl, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 h-full relative"
            >
              <img
                src={imageUrl}
                alt={`Room ${index + 1}`}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 pointer-events-none" />
      
      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex 
                ? 'bg-white w-6' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
