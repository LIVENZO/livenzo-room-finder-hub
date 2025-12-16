import React from 'react';
import { Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RoomVideoPlayerProps {
  videos: string[];
}

const RoomVideoPlayer: React.FC<RoomVideoPlayerProps> = ({ videos }) => {
  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Room Video Tour
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default RoomVideoPlayer;
