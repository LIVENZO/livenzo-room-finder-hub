
import { useState, useMemo } from 'react';
import { Room, RoomFilters, SearchLocation } from '@/types/room';
import { calculateDistance } from '@/utils/roomUtils';

// Helper to check if a room's location text contains the city name
const roomMatchesCity = (room: Room, cityName: string): boolean => {
  const locationLower = room.location?.toLowerCase() || '';
  const cityLower = cityName.toLowerCase();
  
  // Check if room location contains the city name
  return locationLower.includes(cityLower);
};

export const useRoomFilters = (rooms: Room[]) => {
  const [filters, setFilters] = useState<RoomFilters>({
    maxPrice: 10000 // Set default max price to 10000
  });

  const clearAllFilters = () => {
    setFilters({});
  };

  // Filter and sort rooms based on user criteria
  const filteredRooms = useMemo(() => {
    let result = rooms.filter(room => {
      // Filter out unavailable rooms first
      if (room.available === false) {
        return false;
      }

      // Location-based filtering
      if (filters.searchLocation) {
        const { latitude, longitude, radius, searchType, cityName } = filters.searchLocation;
        
        // CITY SEARCH: Filter by city name in location text, NO radius restriction
        if (searchType === 'city' && cityName) {
          if (!roomMatchesCity(room, cityName)) {
            return false;
          }
          // City search passes - no coordinate filtering needed
        }
        
        // LANDMARK/NEAR_ME SEARCH: Strict radius filtering
        else if (searchType === 'landmark' || searchType === 'near_me') {
          // Rooms MUST have coordinates for landmark search
          if (!room.latitude || !room.longitude) {
            return false;
          }
          
          const distance = calculateDistance(
            latitude,
            longitude,
            room.latitude,
            room.longitude
          );
          
          // Strict radius filtering - if outside radius, exclude
          const searchRadius = radius || 3; // Default 3km for landmarks
          if (distance > searchRadius) {
            return false;
          }
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

    // Add distance to each room and sort by distance if search location is set
    if (filters.searchLocation) {
      const { latitude, longitude } = filters.searchLocation;
      
      result = result.map(room => {
        if (room.latitude && room.longitude) {
          const distance = calculateDistance(
            latitude,
            longitude,
            room.latitude,
            room.longitude
          );
          return { ...room, distance };
        }
        return { ...room, distance: undefined };
      });

      // Sort by distance (rooms with coordinates first, then by distance)
      result.sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return result;
  }, [rooms, filters]);

  return { filters, setFilters, filteredRooms, clearAllFilters };
};
