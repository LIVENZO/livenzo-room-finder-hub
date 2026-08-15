import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import room1 from '@/assets/login/room-1.jpg';
import room2 from '@/assets/login/room-2.jpg';
import room3 from '@/assets/login/room-3.jpg';
import room4 from '@/assets/login/room-4.jpg';

const fallbackImages = [room1, room2, room3, room4];

const rowConfig = [
  { anim: 'animate-marquee-left', size: 'h-32 w-28 sm:h-40 sm:w-36' },
  { anim: 'animate-marquee-right', size: 'h-28 w-24 sm:h-36 sm:w-32' },
  { anim: 'animate-marquee-left-slow', size: 'h-32 w-28 sm:h-40 sm:w-36' },
];

/** Rotate an array so each row starts at a different image. */
const rotate = <T,>(arr: T[], by: number) => arr.map((_, i) => arr[(i + by) % arr.length]);

/**
 * Multi-row auto-scrolling image strips (alternating directions), pure CSS, no interaction.
 * Images come from the featured (top) rooms; falls back to bundled samples.
 */
const RoomMarquee: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data, error } = await (supabase as any).rpc('get_top_room_images', { p_limit: 24 });
        if (cancelled || error || !data) return;

        const urls = (data as { image_url: string | null }[])
          .map((r) => r.image_url)
          .filter((u): u is string => Boolean(u && u.trim()));

        if (urls.length > 0) setImages(urls);
      } catch {
        // keep fallback images
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden space-y-2 sm:space-y-3">
      {rowConfig.map((row, rowIndex) => {
        const rowImages = rotate(images, rowIndex * 3);
        const loop = [...rowImages, ...rowImages];
        return (
          <div key={rowIndex} className="w-full overflow-hidden">
            <div className={`flex w-max gap-2 sm:gap-3 ${row.anim} will-change-transform`}>
              {loop.map((src, i) => (
                <div
                  key={`${rowIndex}-${src}-${i}`}
                  className={`${row.size} flex-shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm`}
                >
                  <img
                    src={src}
                    alt="Hostel and room in Kota"
                    loading={rowIndex === 0 && i === 0 ? 'eager' : 'lazy'}
                    width={768}
                    height={768}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        fallbackImages[i % fallbackImages.length];
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {/* Soft edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-14 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-14 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
};

export default RoomMarquee;
