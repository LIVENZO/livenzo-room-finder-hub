
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { Room, RoomFilters } from '@/types/room';
import { fetchRooms as fetchRoomsService } from '@/services/roomService';
import { useRoomFilters } from '@/hooks/useRoomFilters';

interface RoomContextType {
  rooms: Room[];
  isLoading: boolean;
  filters: RoomFilters;
  filteredRooms: Room[];
  setFilters: (filters: RoomFilters) => void;
  getRoom: (id: string) => Room | undefined;
  refreshRooms: () => Promise<void>;
  clearAllFilters: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { filters, setFilters, filteredRooms, clearAllFilters } = useRoomFilters(rooms);

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
