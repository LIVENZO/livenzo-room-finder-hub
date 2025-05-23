
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Bed, Bath, Home, Wifi, Car, Utensils, Wind } from 'lucide-react';
import { Room } from '@/types/room';
import { formatPrice } from '@/lib/utils';
import BookRoom from '@/components/BookRoom';

interface RoomActionCardProps {
  room: Room;
}

const RoomActionCard: React.FC<RoomActionCardProps> = ({ room }) => {
  const facilityIcons = {
    'WiFi': Wifi,
    'Parking': Car,
    'Kitchen': Utensils,
    'AC': Wind,
  };

  // Create amenities array from facilities for display
  const amenities = [];
  if (room.facilities.wifi) amenities.push('WiFi');
  if (room.facilities.bathroom) amenities.push('Bathroom');

  return (
    <div className="sticky top-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-primary">
              {formatPrice(room.price)}
              <span className="text-sm font-normal text-gray-600">/month</span>
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {room.available ? 'Available' : 'Not Available'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{room.location}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-4 border-y">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{room.facilities.gender || 'Any'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{room.facilities.roomType || 'Single'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{room.facilities.bathroom ? 'Private' : 'Shared'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Room</span>
            </div>
          </div>

          {amenities && amenities.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {amenities.map((facility, index) => {
                  const IconComponent = facilityIcons[facility as keyof typeof facilityIcons];
                  return (
                    <div key={index} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                      {IconComponent && <IconComponent className="h-3 w-3" />}
                      <span>{facility}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <BookRoom room={room} />
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomActionCard;
