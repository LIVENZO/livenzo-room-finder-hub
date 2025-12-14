
import React from 'react';
import { Button } from '@/components/ui/button';
import { Room, SearchLocation } from '@/types/room';
import RoomCard from '@/components/RoomCard';

interface RoomResultsProps {
  isLoading: boolean;
  filteredRooms: Room[];
  resetFilters: () => void;
  searchLabel?: string;
  searchLocation?: SearchLocation;
}

const RoomResults: React.FC<RoomResultsProps> = ({ 
  isLoading, 
  filteredRooms, 
  resetFilters,
  searchLabel,
  searchLocation
}) => {
  if (isLoading) {
    return <div className="text-center py-12">Loading rooms...</div>;
  }
  
  // Generate appropriate "no results" message based on search type
  const getNoResultsMessage = () => {
    if (!searchLabel) {
      return 'Try adjusting your filters or search for a different location.';
    }
    
    if (searchLocation?.searchType === 'city') {
      return `No rooms found in "${searchLabel}". This location may not have any listed rooms yet.`;
    }
    
    if (searchLocation?.searchType === 'landmark') {
      return `No rooms found within ${searchLocation.radius || 3} km of "${searchLabel}". Try searching for a different landmark or the city name.`;
    }
    
    if (searchLocation?.searchType === 'near_me') {
      return `No rooms found near your location. Try searching for a specific city or area.`;
    }
    
    return `No rooms found near "${searchLabel}". Try a different location.`;
  };
  
  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg">
        <h3 className="text-xl font-medium mb-2">No rooms found</h3>
        <p className="text-muted-foreground mb-4">
          {getNoResultsMessage()}
        </p>
        <Button onClick={resetFilters} variant="outline">
          Reset All Filters
        </Button>
      </div>
    );
  }
  
  // Generate appropriate results header
  const getResultsText = () => {
    const count = filteredRooms.length;
    const roomWord = count === 1 ? 'room' : 'rooms';
    
    if (!searchLabel) {
      return `Showing ${count} ${roomWord}`;
    }
    
    if (searchLocation?.searchType === 'city') {
      return `Showing ${count} ${roomWord} in ${searchLabel}`;
    }
    
    return `Showing ${count} ${roomWord} near ${searchLabel}`;
  };
  
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <p className="text-muted-foreground">
          {getResultsText()}
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
