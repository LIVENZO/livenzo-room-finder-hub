
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { Room, RoomFilters } from '@/types/room';
import { fetchRooms as fetchRoomsService } from '@/services/roomService';
import { useRoomFilters } from '@/hooks/useRoomFilters';
import { useNearMe } from '@/hooks/useNearMe';
import { useNearPlaceSearch } from '@/hooks/useNearPlaceSearch';

interface RoomContextType {
  rooms: Room[];
  isLoading: boolean;
  filters: RoomFilters;
  filteredRooms: Room[];
  setFilters: (filters: RoomFilters) => void;
  getRoom: (id: string) => Room | undefined;
  refreshRooms: () => Promise<void>;
  clearAllFilters: () => void;
  searchText: string;
  setSearchText: (text: string) => void;
  // Near Me state
  nearMeActive: boolean;
  nearMeLoading: boolean;
  nearMeError: string | null;
  activateNearMe: () => void;
  deactivateNearMe: () => void;
  // Near Place search state
  nearPlaceActive: boolean;
  nearPlaceLoading: boolean;
  nearPlaceError: string | null;
  nearPlaceName: string | null;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  
  const {
    isActive: nearMeActive,
    isLoading: nearMeLoading,
    error: nearMeError,
    activateNearMe,
    deactivateNearMe,
    calculateRoomDistances,
  } = useNearMe();

  const {
    isActive: nearPlaceActive,
    isLoading: nearPlaceLoading,
    error: nearPlaceError,
    placeName: nearPlaceName,
    searchNearPlace,
    resetNearPlace,
  } = useNearPlaceSearch();

  // Near place search results override
  const [nearPlaceRooms, setNearPlaceRooms] = useState<Room[] | null>(null);

  // Apply distance calculations when near me is active
  const roomsWithDistance = useMemo(() => {
    if (nearMeActive) {
      return calculateRoomDistances(rooms);
    }
    // Clear distance when near me is off
    return rooms.map(room => ({ ...room, distance: undefined }));
  }, [rooms, nearMeActive, calculateRoomDistances]);

  const { filters, setFilters, filteredRooms: baseFilteredRooms, clearAllFilters: baseClearAllFilters, searchText, setSearchText } = useRoomFilters(roomsWithDistance);

  // Handle "near" place search when searchText changes
  const searchDebounceRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Check if searchText contains "near" pattern
    const hasNearPattern = /\bnear\s+.{2,}/i.test(searchText);
    
    if (!hasNearPattern) {
      if (nearPlaceRooms !== null) {
        setNearPlaceRooms(null);
        resetNearPlace();
      }
      return;
    }

    // Debounce the near place search
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      const result = await searchNearPlace(searchText, rooms);
      setNearPlaceRooms(result);
    }, 600);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchText, rooms]);

  // Use near place results when active, otherwise use normal filtered rooms
  const filteredRooms = nearPlaceRooms !== null ? nearPlaceRooms : baseFilteredRooms;

  const clearAllFilters = () => {
    baseClearAllFilters();
    setNearPlaceRooms(null);
    resetNearPlace();
  };

  // Fetch rooms from Supabase
  useEffect(() => {
    setIsLoading(true);
    loadRooms();
  }, [user]);

  const loadRooms = async () => {
    try {
      const fetchedRooms = await fetchRoomsService();
      setRooms(fetchedRooms);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRooms = async () => {
    setIsLoading(true);
    try {
      const fetchedRooms = await fetchRoomsService();
      setRooms(fetchedRooms);
      toast.success('Rooms refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh rooms');
    } finally {
      setIsLoading(false);
    }
  };

  // Get a specific room by ID
  const getRoom = (id: string) => {
    return rooms.find(room => room.id === id);
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        isLoading,
        filters,
        filteredRooms,
        setFilters,
        getRoom,
        refreshRooms,
        clearAllFilters,
        searchText,
        setSearchText,
        nearMeActive,
        nearMeLoading,
        nearMeError,
        activateNearMe,
        deactivateNearMe,
        nearPlaceActive,
        nearPlaceLoading,
        nearPlaceError,
        nearPlaceName,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return context;
};

// Export the Room type from types/room
export type { Room } from '@/types/room';
