import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, Bath, User, Users, BedSingle, BedDouble } from 'lucide-react';
import { Room } from '@/types/room';

interface RoomCardProps {
  room: Room;
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const navigate = useNavigate();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const getGenderIcon = () => {
    switch (room.facilities.gender) {
      case 'male':
        return <User className="h-4 w-4 mr-1" />;
      case 'female':
        return <User className="h-4 w-4 mr-1" />;
      default:
        return <Users className="h-4 w-4 mr-1" />;
    }
  };
  
  const getGenderText = () => {
    switch (room.facilities.gender) {
      case 'male':
        return 'Boys only';
      case 'female':
        return 'Girls only';
      default:
        return 'Any gender';
    }
  };
  
  const getRoomTypeIcon = () => {
    switch (room.facilities.roomType) {
      case 'single':
        return <BedSingle className="h-4 w-4 mr-1" />;
      case 'sharing':
        return <BedDouble className="h-4 w-4 mr-1" />;
      default:
        return <BedSingle className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
      onClick={() => navigate(`/room/${room.id}`)}
    >
      <div className="relative aspect-video">
        <img 
          src={room.images[0]} 
          alt={room.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-primary">{formatPrice(room.price)}/mo</Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1">{room.title}</h3>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">{room.location}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        <Badge variant="outline" className="flex items-center">
          {getRoomTypeIcon()}
          {room.facilities.roomType === 'single' ? 'Single' : 'Sharing'}
        </Badge>
        {room.facilities.wifi && (
          <Badge variant="outline" className="flex items-center">
            <Wifi className="h-4 w-4 mr-1" />
            WiFi
          </Badge>
        )}
        <Badge variant="outline" className="flex items-center">
          {getGenderIcon()}
          {getGenderText()}
        </Badge>
        {room.facilities.bathroom && (
          <Badge variant="outline" className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            Connected Bathroom
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default RoomCard;
