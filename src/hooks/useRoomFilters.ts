
import { useState, useMemo } from 'react';
import { Room, RoomFilters } from '@/types/room';

export const useRoomFilters = (rooms: Room[]) => {
  const [filters, setFilters] = useState<RoomFilters>({
    maxPrice: 10000 // Set default max price to 10000
  });

  const clearAllFilters = () => {
    setFilters({});
  };

  // Filter rooms based on user criteria
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Filter by location
      if (filters.location && !room.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      
      // Filter by max price
      if (filters.maxPrice && room.price > filters.maxPrice) {
        return false;
      }
      
      // Filter by wifi
      if (filters.wifi && !room.facilities.wifi) {
        return false;
      }
      
      // Filter by bathroom
      if (filters.bathroom && !room.facilities.bathroom) {
        return false;
      }
      
      // Filter by gender preference
      if (filters.gender && room.facilities.gender !== 'any' && room.facilities.gender !== filters.gender) {
        return false;
      }
      
      // Filter by room type
      if (filters.roomType && room.facilities.roomType !== filters.roomType) {
        return false;
      }
      
      // Filter out unavailable rooms
      if (room.available === false) {
        return false;
      }
      
      return true;
    });
  }, [rooms, filters]);

  return { filters, setFilters, filteredRooms, clearAllFilters };
};
