
import React from 'react';
import { Room } from '@/types/room';
import RoomManagementCard from '@/components/RoomManagementCard';

interface RoomListProps {
  rooms: Room[];
  updatingRoom: string | null;
  setUpdatingRoom: React.Dispatch<React.SetStateAction<string | null>>;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, updatingRoom, setUpdatingRoom }) => {
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
};

export default RoomList;
