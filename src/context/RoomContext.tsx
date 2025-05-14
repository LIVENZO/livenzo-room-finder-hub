
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { Room, RoomFilters } from '@/types/room';
import { 
  fetchRooms as fetchRoomsService,
  addRoomService,
  updateRoomService,
  deleteRoomService,
  updateRoomAvailabilityService
} from '@/services/roomService';
import { useRoomFilters } from '@/hooks/useRoomFilters';

interface RoomContextType {
  rooms: Room[];
  isLoading: boolean;
  filters: RoomFilters;
  filteredRooms: Room[];
  setFilters: (filters: RoomFilters) => void;
  addRoom: (room: Omit<Room, 'id' | 'createdAt'>) => Promise<void>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  getUserRooms: () => Room[];
  getRoom: (id: string) => Room | undefined;
  updateRoomAvailability: (id: string, available: boolean) => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { filters, setFilters, filteredRooms } = useRoomFilters(rooms);

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

  // Add a new room
  const addRoom = async (room: Omit<Room, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error('You must be logged in to list a room');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const newRoom = await addRoomService(room);
      
      if (newRoom) {
        setRooms(prev => [...prev, newRoom]);
        toast.success('Room listed successfully');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update a room
  const updateRoom = async (id: string, updates: Partial<Room>) => {
    setIsLoading(true);
    
    try {
      const updatedRoom = await updateRoomService(id, updates);
      
      if (updatedRoom) {
        setRooms(prev => prev.map(room => room.id === id ? updatedRoom : room));
        toast.success('Room updated successfully');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a room
  const deleteRoom = async (id: string) => {
    setIsLoading(true);
    
    try {
      const success = await deleteRoomService(id);
      
      if (success) {
        setRooms(prev => prev.filter(room => room.id !== id));
        toast.success('Room deleted successfully');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get a specific room by ID
  const getRoom = (id: string) => {
    return rooms.find(room => room.id === id);
  };

  // Get rooms owned by the current user
  const getUserRooms = () => {
    if (!user) return [];
    
    const userId = user.id;
    return rooms.filter(room => room.ownerId === userId);
  };

  // Update room availability
  const updateRoomAvailability = async (id: string, available: boolean) => {
    try {
      const success = await updateRoomAvailabilityService(id, available);
      
      if (success) {
        // Update local state
        setRooms(prev => prev.map(room => 
          room.id === id ? { ...room, available } : room
        ));
      }
    } catch (error) {
      console.error('Error updating room availability:', error);
      toast.error('Failed to update room availability');
    }
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        isLoading,
        filters,
        filteredRooms,
        setFilters,
        addRoom,
        updateRoom,
        deleteRoom,
        getUserRooms,
        getRoom,
        updateRoomAvailability
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
