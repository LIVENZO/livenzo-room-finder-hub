
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, useRooms } from '@/context/RoomContext';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Wifi,
  Bath,
  BedSingle,
  BedDouble,
  User,
  Users,
  Loader2
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface RoomManagementCardProps {
  room: Room;
  isUpdating: boolean;
  setUpdatingRoom: (roomId: string | null) => void;
}

const RoomManagementCard: React.FC<RoomManagementCardProps> = ({ 
  room, 
  isUpdating, 
  setUpdatingRoom 
}) => {
  const navigate = useNavigate();
  const { updateRoomAvailability } = useRooms();

  const handleAvailabilityChange = async (available: boolean) => {
    setUpdatingRoom(room.id);
    await updateRoomAvailability(room.id, available);
    setUpdatingRoom(null);
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video overflow-hidden relative">
        <img 
          src={room.images[0]} 
          alt={room.title} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <Badge className={room.available ? "bg-green-500" : "bg-red-500"}>
            {room.available ? "Available" : "Unavailable"}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1">{room.title}</CardTitle>
        <p className="text-sm text-gray-500">{room.location}</p>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-bold">{formatPrice(room.price)}/mo</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {room.facilities.wifi && (
            <Badge variant="outline" className="flex items-center">
              <Wifi className="h-3 w-3 mr-1" /> WiFi
            </Badge>
          )}
          
          {room.facilities.bathroom && (
            <Badge variant="outline" className="flex items-center">
              <Bath className="h-3 w-3 mr-1" /> Bath
            </Badge>
          )}
          
          <Badge variant="outline" className="flex items-center">
            {room.facilities.roomType === 'single' ? (
              <>
                <BedSingle className="h-3 w-3 mr-1" /> Single
              </>
            ) : (
              <>
                <BedDouble className="h-3 w-3 mr-1" /> Sharing
              </>
            )}
          </Badge>
          
          <Badge variant="outline" className="flex items-center">
            {room.facilities.gender === 'male' ? (
              <>
                <User className="h-3 w-3 mr-1" /> Male
              </>
            ) : room.facilities.gender === 'female' ? (
              <>
                <User className="h-3 w-3 mr-1" /> Female
              </>
            ) : (
              <>
                <Users className="h-3 w-3 mr-1" /> Any
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center mt-4">
          <span className="mr-2 font-medium">Availability:</span>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Switch 
              checked={!!room.available} 
              onCheckedChange={handleAvailabilityChange}
            />
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(`/room/${room.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/edit-room/${room.id}`)}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RoomManagementCard;
