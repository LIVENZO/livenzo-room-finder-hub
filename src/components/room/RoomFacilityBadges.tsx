
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, Bath, User, Users, BedSingle, BedDouble, Wind, Snowflake } from 'lucide-react';
import { Room } from '@/types/room';

interface RoomFacilityBadgesProps {
  room: Room;
}

const RoomFacilityBadges: React.FC<RoomFacilityBadgesProps> = ({ room }) => {
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
  
  const getCoolingTypeIcon = () => {
    switch (room.facilities.coolingType) {
      case 'ac':
        return <Snowflake className="h-4 w-4 mr-1" />;
      case 'cooler':
        return <Wind className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <>
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
      {room.facilities.coolingType && (
        <Badge variant="outline" className="flex items-center">
          {getCoolingTypeIcon()}
          {room.facilities.coolingType === 'ac' ? 'AC Room' : 'Cooler Room'}
        </Badge>
      )}
    </>
  );
};

export default RoomFacilityBadges;
