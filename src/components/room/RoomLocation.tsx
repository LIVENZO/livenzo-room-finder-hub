
import React from 'react';
import { MapPin } from 'lucide-react';

interface RoomLocationProps {
  location: string;
}

const RoomLocation: React.FC<RoomLocationProps> = ({ location }) => {
  return (
    <div className="flex items-center mt-2 text-sm text-gray-500">
      <MapPin className="h-4 w-4 mr-1" />
      <span className="line-clamp-1">{location}</span>
    </div>
  );
};

export default RoomLocation;
