
import React from 'react';
import { Button } from '@/components/ui/button';
import { Room } from '@/types/room';
import RoomCard from '@/components/RoomCard';

interface RoomResultsProps {
  isLoading: boolean;
  filteredRooms: Room[];
  resetFilters: () => void;
  searchLabel?: string;
}

const RoomResults: React.FC<RoomResultsProps> = ({ 
  isLoading, 
  filteredRooms, 
  resetFilters,
  searchLabel
}) => {
  if (isLoading) {
    return <div className="text-center py-12">Loading rooms...</div>;
  }
  
  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg">
        <h3 className="text-xl font-medium mb-2">No rooms found</h3>
        <p className="text-muted-foreground mb-4">
          {searchLabel 
            ? `No rooms found near "${searchLabel}". Try a different location or increase the search area.`
            : 'Try adjusting your filters or search for a different location.'
          }
        </p>
        <Button onClick={resetFilters} variant="outline">
          Reset All Filters
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <p className="text-muted-foreground">
          Showing {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'}
          {searchLabel && ` near ${searchLabel}`}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <RoomCard key={room.id} room={room} searchLabel={searchLabel} />
        ))}
      </div>
    </>
  );
};

export default RoomResults;
