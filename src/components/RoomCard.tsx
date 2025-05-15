
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { Room } from '@/types/room';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import RoomFacilityBadges from './room/RoomFacilityBadges';
import RoomPriceBadge from './room/RoomPriceBadge';
import RoomLocation from './room/RoomLocation';

interface RoomCardProps {
  room: Room;
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
      onClick={() => navigate(`/room/${room.id}`)}
    >
      <AspectRatio ratio={16/9} className="relative">
        <img 
          src={room.images[0]} 
          alt={room.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <RoomPriceBadge price={room.price} />
        </div>
      </AspectRatio>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{room.title}</h3>
        <RoomLocation location={room.location} />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        <RoomFacilityBadges room={room} />
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
