
import { useState, useMemo } from 'react';
import { Room, RoomFilters } from '@/types/room';

export const useRoomFilters = (rooms: Room[]) => {
  const [filters, setFilters] = useState<RoomFilters>({});
  const [searchText, setSearchText] = useState('');

  const clearAllFilters = () => {
    setFilters({});
    setSearchText('');
  };

  // Filter and sort rooms based on user criteria
  const filteredRooms = useMemo(() => {
    let result = rooms.filter(room => {
      // Filter out unavailable rooms first
      if (room.available === false) {
        return false;
      }

      // Text-based search on location/area name (case-insensitive)
      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase().trim();
        const locationMatch = room.location?.toLowerCase().includes(searchLower);
        const titleMatch = room.title?.toLowerCase().includes(searchLower);
        if (!locationMatch && !titleMatch) {
          return false;
        }
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
      
      // Filter by cooling type
      if (filters.coolingType && room.facilities.coolingType !== filters.coolingType) {
        return false;
      }
      
      // Filter by food
      if (filters.food && room.facilities.food !== filters.food) {
        return false;
      }
      
      return true;
    });

    // Sort: nearest first (if has location), then by price (lowest first), then by date (newest first)
    result.sort((a, b) => {
      // If both have distance, sort by distance first
      if (a.distance !== undefined && b.distance !== undefined) {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
      } else if (a.distance !== undefined) {
        return -1;
      } else if (b.distance !== undefined) {
        return 1;
      }
      
      // Then sort by price (lowest first)
      if (a.price !== b.price) {
        return a.price - b.price;
      }
      
      // Then sort by created date (newest first)
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return result;
  }, [rooms, filters, searchText]);

  return { 
    filters, 
    setFilters, 
    filteredRooms, 
    clearAllFilters,
    searchText,
    setSearchText
  };
};
