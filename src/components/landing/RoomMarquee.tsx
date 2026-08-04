import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import room1 from '@/assets/login/room-1.jpg';
import room2 from '@/assets/login/room-2.jpg';
import room3 from '@/assets/login/room-3.jpg';
import room4 from '@/assets/login/room-4.jpg';

const fallbackImages = [room1, room2, room3, room4];

/**
 * Auto-scrolling horizontal image strip (right → left), pure CSS, no interaction.
 * Images come from the featured (top) rooms; falls back to bundled samples.
 */
const RoomMarquee: React.FC = () => {
  const [images, setImages] = useState<string[]>(fallbackImages);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data, error } = await (supabase as any).rpc('get_top_room_images', { p_limit: 12 });
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

  const loop = [...images, ...images];

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex w-max gap-3 animate-marquee-left will-change-transform">
        {loop.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="h-40 w-32 sm:h-48 sm:w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-muted shadow-md"
          >
            <img
              src={src}
              alt="Hostel and room in Kota"
              loading={i === 0 ? 'eager' : 'lazy'}
              width={768}
              height={768}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = fallbackImages[i % fallbackImages.length];
              }}
            />
          </div>
        ))}
      </div>
      {/* Soft edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
};

export default RoomMarquee;
