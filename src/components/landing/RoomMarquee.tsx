import React from 'react';
import room1 from '@/assets/login/room-1.jpg';
import room2 from '@/assets/login/room-2.jpg';
import room3 from '@/assets/login/room-3.jpg';
import room4 from '@/assets/login/room-4.jpg';

const images = [room1, room2, room3, room4];

/**
 * Auto-scrolling horizontal image strip (right → left), pure CSS, no interaction.
 */
const RoomMarquee: React.FC = () => {
  const loop = [...images, ...images];

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex w-max gap-3 animate-marquee-left will-change-transform">
        {loop.map((src, i) => (
          <div
            key={i}
            className="h-40 w-32 sm:h-48 sm:w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-muted shadow-md"
          >
            <img
              src={src}
              alt="Hostel and room in Kota"
              loading={i === 0 ? 'eager' : 'lazy'}
              width={768}
              height={768}
              className="h-full w-full object-cover"
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
