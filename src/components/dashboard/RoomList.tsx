
import React from 'react';
import { Room } from '@/types/room';
import { Card, CardContent } from "@/components/ui/card";
import RoomManagementCard from '@/components/RoomManagementCard';
import { useAuth } from '@/context/AuthContext';

interface RoomListProps {
  rooms: Room[];
  updatingRoom: string | null;
  setUpdatingRoom: React.Dispatch<React.SetStateAction<string | null>>;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, updatingRoom, setUpdatingRoom }) => {
  const { userRole } = useAuth();
  
  if (rooms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No rooms available.</p>
      </div>
    );
  }

  // If user is an owner viewing their listings, use the management card
  if (userRole === 'owner') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomManagementCard 
            key={room.id} 
            room={room} 
            isUpdating={updatingRoom === room.id}
            setUpdatingRoom={setUpdatingRoom}
          />
        ))}
      </div>
    );
  }
  
  // Default view for renters and other users
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <Card key={room.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="font-medium">{room.title}</div>
              <p className="text-sm text-muted-foreground">{room.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RoomList;
