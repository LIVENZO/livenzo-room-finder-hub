
import React from 'react';
import { Room } from '@/types/room';
import RoomCard from '@/components/RoomCard';
import { Loader2 } from 'lucide-react';

interface RoomResultsProps {
  isLoading: boolean;
  filteredRooms: Room[];
  clearFilters: () => void;
  searchText: string;
  searchContext?: { searchQuery?: string; selectedCategory?: string };
}

const RoomResults: React.FC<RoomResultsProps> = ({
  isLoading,
  filteredRooms,
  clearFilters,
  searchText,
  searchContext
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-label="Loading rooms">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
        <RoomCard key={room.id} room={room} searchContext={searchContext} />
        )}
      </div>
    </>);

};

export default RoomResults;