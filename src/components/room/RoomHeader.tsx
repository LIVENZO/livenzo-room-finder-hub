
import React from 'react';
import { Heart, Loader2, StarIcon, MapPin, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Room } from '@/types/room';
import RoomFacilityBadges from './RoomFacilityBadges';

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
  return (
    <div className="mt-6">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold">{room.title}</h1>
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
      
      {/* House Name and House Number */}
      {(room.house_name || room.house_no) && (
        <div className="flex items-center mt-3 text-lg font-medium text-gray-700">
          <Home className="h-5 w-5 text-gray-500 mr-2" />
          <span>
            {room.house_name && room.house_no 
              ? `${room.house_name}, ${room.house_no}`
              : room.house_name || room.house_no
            }
          </span>
        </div>
      )}
      
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
      
      <div className="flex flex-wrap gap-2 mt-4">
        <RoomFacilityBadges room={room} />
      </div>
    </div>
  );
};

export default RoomHeader;
