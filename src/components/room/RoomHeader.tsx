
import React from 'react';
import { Heart, Loader2, StarIcon, MapPin, Home, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Room } from '@/types/room';
import RoomFacilityBadges from './RoomFacilityBadges';
import { toast } from 'sonner';

interface RoomHeaderProps {
  room: Room;
  isFavorite: boolean;
  favoritesLoading: boolean;
  handleFavoriteToggle: () => void;
  roomRating: number;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  isFavorite,
  favoritesLoading,
  handleFavoriteToggle,
  roomRating,
}) => {
  // Debug logging to check if house data is available
  console.log('Room data in RoomHeader:', {
    house_name: room.house_name,
    house_no: room.house_no,
    title: room.title
  });

  const handleShare = () => {
    const shareUrl = `https://livenzo-room-finder-hub.lovable.app/room/${room.id}`;
    const shareText = `Check out this room on Livenzo 👇\n₹${room.price.toLocaleString()}/month – ${room.title}, ${room.location}\n${shareUrl}`;
    
    // Open WhatsApp directly
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold">{room.title}</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleFavoriteToggle}
            disabled={favoritesLoading}
          >
            {favoritesLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            )}
          </Button>
        </div>
      </div>
      
      
      <div className="flex items-center mt-2">
        <MapPin className="h-4 w-4 text-gray-500 mr-1" />
        <span className="text-gray-500">{room.location}</span>
      </div>
      
      <div className="flex items-center mt-2 space-x-2">
        <div className="flex items-center">
          <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
          <span>{roomRating || 'New'}</span>
        </div>
        <span className="text-gray-500">•</span>
        <span>Posted on {format(new Date(room.createdAt || new Date()), 'PP')}</span>
      </div>
      
    </div>
  );
};

export default RoomHeader;
