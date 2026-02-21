
import React from 'react';
import { Button } from '@/components/ui/button';
import { Room } from '@/types/room';
import RoomCard from '@/components/RoomCard';

interface RoomResultsProps {
  isLoading: boolean;
  filteredRooms: Room[];
  clearFilters: () => void;
  searchText: string;
}

const RoomResults: React.FC<RoomResultsProps> = ({
  isLoading,
  filteredRooms,
  clearFilters,
  searchText
}) => {
  if (isLoading) {
    return <div className="text-center py-12">Loading rooms...</div>;
  }

  if (filteredRooms.length === 0) {
    // WhatsApp support banner is shown in FindRoom.tsx, so return null here
    return null;
  }

  return (
    <>
      <div className="mb-4">
        





      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) =>
        <RoomCard key={room.id} room={room} />
        )}
      </div>
    </>);

};

export default RoomResults;