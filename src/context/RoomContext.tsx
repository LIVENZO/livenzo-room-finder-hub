
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Room {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  location: string;
  facilities: {
    wifi?: boolean;
    bathroom?: boolean;
    gender?: 'male' | 'female' | 'any';
    roomType?: 'single' | 'sharing';
  };
  ownerId: string;
  ownerPhone: string;
  available?: boolean;
  createdAt?: string;
}

interface RoomContextType {
  rooms: Room[];
  isLoading: boolean;
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
  const { user, isGuestMode, userRole } = useAuth();

  // Fetch rooms from Supabase
  useEffect(() => {
    setIsLoading(true);
    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    try {
      console.log('Fetching rooms...');
      // Using a direct untyped query to avoid TS errors with the new table
      // that doesn't have TypeScript definitions yet
      const { data, error } = await supabase
        .from('rooms')
        .select('*') as { data: any[], error: any };
      
      if (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to fetch rooms');
      } else {
        console.log('Rooms fetched:', data);
        if (data) {
          // Map Supabase data to Room interface
          const fetchedRooms = data.map((room: any) => ({
            id: room.id,
            title: room.title,
            description: room.description,
            images: room.images,
            price: room.price,
            location: room.location,
            facilities: room.facilities,
            ownerId: room.owner_id,
            ownerPhone: room.owner_phone,
            available: room.available,
            createdAt: room.created_at
          }));
          setRooms(fetchedRooms);
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to fetch rooms');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new room
  const addRoom = async (room: Omit<Room, 'id' | 'createdAt'>) => {
    if (!user && !isGuestMode) {
      toast.error('You must be logged in to list a room');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Using a direct untyped query to avoid TS errors
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          title: room.title,
          description: room.description,
          images: room.images,
          price: room.price,
          location: room.location,
          facilities: room.facilities,
          owner_id: room.ownerId,
          owner_phone: room.ownerPhone,
          available: true
        })
        .select() as { data: any[], error: any };
      
      if (error) {
        console.error('Error adding room:', error);
        toast.error('Failed to list room');
      } else if (data && data[0]) {
        const newRoom: Room = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          images: data[0].images,
          price: data[0].price,
          location: data[0].location,
          facilities: data[0].facilities,
          ownerId: data[0].owner_id,
          ownerPhone: data[0].owner_phone,
          available: data[0].available,
          createdAt: data[0].created_at
        };
        
        setRooms(prev => [...prev, newRoom]);
        toast.success('Room listed successfully');
      }
    } catch (error) {
      console.error('Error adding room:', error);
      toast.error('Failed to list room');
    } finally {
      setIsLoading(false);
    }
  };

  // Update a room
  const updateRoom = async (id: string, updates: Partial<Room>) => {
    setIsLoading(true);
    
    try {
      // Map Room interface updates to database column names
      const dbUpdates: any = {};
      
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.images) dbUpdates.images = updates.images;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.location) dbUpdates.location = updates.location;
      if (updates.facilities) dbUpdates.facilities = updates.facilities;
      if (updates.ownerPhone) dbUpdates.owner_phone = updates.ownerPhone;
      if (updates.available !== undefined) dbUpdates.available = updates.available;
      
      // Using a direct untyped query to avoid TS errors
      const { data, error } = await supabase
        .from('rooms')
        .update(dbUpdates)
        .eq('id', id)
        .select() as { data: any[], error: any };
      
      if (error) {
        console.error('Error updating room:', error);
        toast.error('Failed to update room');
      } else if (data && data[0]) {
        // Update room in state
        setRooms(prev => 
          prev.map(room => 
            room.id === id 
              ? {
                  id: data[0].id,
                  title: data[0].title,
                  description: data[0].description,
                  images: data[0].images,
                  price: data[0].price,
                  location: data[0].location,
                  facilities: data[0].facilities,
                  ownerId: data[0].owner_id,
                  ownerPhone: data[0].owner_phone,
                  available: data[0].available,
                  createdAt: data[0].created_at
                }
              : room
          )
        );
        
        toast.success('Room updated successfully');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update room');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a room
  const deleteRoom = async (id: string) => {
    setIsLoading(true);
    
    try {
      // Delete room from Supabase
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting room:', error);
        toast.error('Failed to delete room');
      } else {
        // Remove room from state
        setRooms(prev => prev.filter(room => room.id !== id));
        toast.success('Room deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
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
    if (!user && !isGuestMode) return [];
    
    const userId = user ? user.id : 'guest';
    return rooms.filter(room => room.ownerId === userId);
  };

  // Update room availability
  const updateRoomAvailability = async (id: string, available: boolean) => {
    return updateRoom(id, { available });
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        isLoading,
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
