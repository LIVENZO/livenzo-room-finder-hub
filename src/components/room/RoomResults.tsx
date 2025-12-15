
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
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg">
        <h3 className="text-xl font-medium mb-2">No rooms found in this area</h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your filters or search for a different area.
        </p>
        <Button onClick={clearFilters} variant="outline">
          Clear Filters
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <div className="mb-4">
        <p className="text-muted-foreground">
          {searchText 
            ? `Showing ${filteredRooms.length} ${filteredRooms.length === 1 ? 'room' : 'rooms'} in ${searchText}`
            : `Showing ${filteredRooms.length} ${filteredRooms.length === 1 ? 'room' : 'rooms'} in Kota`
          }
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </>
  );
};

export default RoomResults;
