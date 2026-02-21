
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { Room, RoomFilters } from '@/types/room';
import { fetchRooms as fetchRoomsService } from '@/services/roomService';
import { useRoomFilters } from '@/hooks/useRoomFilters';
import { useNearMe } from '@/hooks/useNearMe';
import { useHotspotSearch } from '@/hooks/useHotspotSearch';
import { Hotspot } from '@/services/HotspotService';

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
  // Hotspot state
  hotspotSuggestions: Hotspot[];
  activeHotspot: Hotspot | null;
  updateHotspotSuggestions: (query: string) => void;
  selectHotspot: (hotspot: Hotspot) => void;
  clearHotspot: () => void;
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
    suggestions: hotspotSuggestions,
    activeHotspot,
    updateSuggestions: updateHotspotSuggestions,
    selectHotspot,
    clearHotspot,
  } = useHotspotSearch();

  // Apply distance calculations when near me is active
  const roomsWithDistance = useMemo(() => {
    if (nearMeActive) {
      return calculateRoomDistances(rooms);
    }
    return rooms.map(room => ({ ...room, distance: undefined }));
  }, [rooms, nearMeActive, calculateRoomDistances]);

  const { filters, setFilters, filteredRooms, clearAllFilters, searchText, setSearchText } = useRoomFilters(roomsWithDistance, activeHotspot);

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
        hotspotSuggestions,
        activeHotspot,
        updateHotspotSuggestions,
        selectHotspot,
        clearHotspot,
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

export type { Room } from '@/types/room';
