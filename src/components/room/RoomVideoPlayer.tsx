import React from 'react';
import { Video } from 'lucide-react';

interface RoomVideoPlayerProps {
  videos: string[];
}

const RoomVideoPlayer: React.FC<RoomVideoPlayerProps> = ({ videos }) => {
  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Video className="h-5 w-5" />
        Room Video Tour
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {videos.map((videoUrl, index) => (
          <div key={index} className="relative rounded-lg overflow-hidden bg-black">
            <video
              src={videoUrl}
              controls
              controlsList="nodownload"
              playsInline
              preload="metadata"
              className="w-full max-h-[400px] object-contain"
              poster={`${videoUrl}#t=0.5`}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomVideoPlayer;
