
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
  
  const handleWhatsAppSupport = () => {
    const phoneNumber = '917488698970';
    const message = encodeURIComponent(
      `Hi, I'm looking for a room.\n\nBudget:\nLocation:`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  if (filteredRooms.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No rooms found in this area</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search for a different area.
          </p>
          <Button onClick={clearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>

        {/* WhatsApp Support Banner */}
        <div className="bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl p-6 shadow-sm border border-border/50">
          <div className="text-center space-y-4">
            <h4 className="text-lg font-semibold text-foreground">
              😕 No rooms available right now
            </h4>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Don't worry — our team helps students find rooms personally on WhatsApp.
            </p>
            <Button
              onClick={handleWhatsAppSupport}
              className="w-full sm:w-auto px-6 py-3 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: '#25D366' }}
            >
              Chat with Room Expert
            </Button>
          </div>
        </div>
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
