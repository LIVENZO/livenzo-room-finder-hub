
import React, { createContext, useState, useContext, useEffect } from 'react';
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
    wifi: boolean;
    gender: 'any' | 'male' | 'female';
    bathroom: boolean;
    roomType: 'single' | 'sharing';
  };
  ownerId: string;
  ownerPhone: string;
  createdAt: string;
  available?: boolean;
}

export interface RoomFilters {
  location?: string;
  maxPrice?: number;
  wifi?: boolean;
  gender?: 'any' | 'male' | 'female';
  bathroom?: boolean;
  roomType?: 'single' | 'sharing';
}

interface RoomContextType {
  rooms: Room[];
  filteredRooms: Room[];
  filters: RoomFilters;
  setFilters: (filters: RoomFilters) => void;
  addRoom: (room: Omit<Room, 'id' | 'createdAt'>) => Promise<void>;
  updateRoomAvailability: (roomId: string, available: boolean) => Promise<boolean>;
  getUserRooms: () => Room[];
  isLoading: boolean;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

// Sample room data
const sampleRooms: Room[] = [
  {
    id: 'room1',
    title: 'Cozy Single Room in Downtown',
    description: 'Comfortable single room with natural lighting and close to amenities.',
    images: ['https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=500&auto=format'],
    price: 30000,
    location: 'New Delhi, India',
    facilities: {
      wifi: true,
      gender: 'any',
      bathroom: true,
      roomType: 'single',
    },
    ownerId: 'owner1',
    ownerPhone: '555-123-4567',
    createdAt: '2023-10-15',
  },
  {
    id: 'room2',
    title: 'Modern Studio for Students',
    description: 'Perfect for students, close to university with study area.',
    images: ['https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=500&auto=format'],
    price: 25000,
    location: 'Mumbai, India',
    facilities: {
      wifi: true,
      gender: 'male',
      bathroom: false,
      roomType: 'sharing',
    },
    ownerId: 'owner2',
    ownerPhone: '555-987-6543',
    createdAt: '2023-10-10',
  },
  {
    id: 'room3',
    title: 'Luxury Room with Mountain View',
    description: 'Spacious room with private balcony overlooking mountains.',
    images: ['https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=500&auto=format'],
    price: 45000,
    location: 'Bangalore, India',
    facilities: {
      wifi: true,
      gender: 'female',
      bathroom: true,
      roomType: 'single',
    },
    ownerId: 'owner3',
    ownerPhone: '555-456-7890',
    createdAt: '2023-10-05',
  },
  {
    id: 'room4',
    title: 'Budget Friendly Room Near City Center',
    description: 'Affordable room with shared amenities in a vibrant neighborhood.',
    images: ['https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=500&auto=format'],
    price: 18000,
    location: 'Hyderabad, India',
    facilities: {
      wifi: false,
      gender: 'any',
      bathroom: false,
      roomType: 'sharing',
    },
    ownerId: 'owner4',
    ownerPhone: '555-789-0123',
    createdAt: '2023-10-01',
  },
];

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [filters, setFilters] = useState<RoomFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch rooms from Supabase
  useEffect(() => {
    async function fetchRooms() {
      setIsLoading(true);
      try {
        // Use raw SQL query to fetch rooms since the "rooms" table is not yet in the TypeScript types
        const { data, error } = await supabase.rpc('get_rooms');
        
        if (error) {
          console.error('Error fetching rooms:', error);
          toast.error('Failed to fetch rooms');
          
          // Fall back to sample data or cached data
          const savedRooms = localStorage.getItem('livenzo_rooms');
          if (savedRooms) {
            setRooms(JSON.parse(savedRooms));
          } else {
            setRooms(sampleRooms);
            localStorage.setItem('livenzo_rooms', JSON.stringify(sampleRooms));
          }
        } else {
          // Transform data from Supabase format to our Room interface
          if (data && data.length > 0) {
            const formattedRooms: Room[] = data.map((room: any) => ({
              id: room.id,
              title: room.title,
              description: room.description,
              images: room.images,
              price: room.price,
              location: room.location,
              facilities: room.facilities,
              ownerId: room.owner_id,
              ownerPhone: room.owner_phone,
              createdAt: room.created_at,
              available: room.available !== false // default to true if not specified
            }));
            
            setRooms(formattedRooms);
            
            // Update localStorage cache
            localStorage.setItem('livenzo_rooms', JSON.stringify(formattedRooms));
          } else {
            // If no data in Supabase yet, use sample data
            const savedRooms = localStorage.getItem('livenzo_rooms');
            if (savedRooms) {
              setRooms(JSON.parse(savedRooms));
            } else {
              setRooms(sampleRooms);
              localStorage.setItem('livenzo_rooms', JSON.stringify(sampleRooms));
            }
          }
        }
      } catch (error) {
        console.error('Error in fetching rooms:', error);
        toast.error('Failed to fetch rooms');
        
        // Fall back to sample data
        setRooms(sampleRooms);
        localStorage.setItem('livenzo_rooms', JSON.stringify(sampleRooms));
      } finally {
        setIsLoading(false);
      }
    }

    fetchRooms();
  }, []);

  // Apply filters whenever rooms or filters change
  useEffect(() => {
    let result = [...rooms];
    
    if (filters.location) {
      result = result.filter(room => 
        room.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    
    if (filters.maxPrice) {
      result = result.filter(room => room.price <= filters.maxPrice!);
    }
    
    if (filters.wifi !== undefined) {
      result = result.filter(room => room.facilities.wifi === filters.wifi);
    }
    
    if (filters.gender && filters.gender !== 'any') {
      result = result.filter(room => 
        room.facilities.gender === filters.gender || room.facilities.gender === 'any');
    }
    
    if (filters.bathroom !== undefined) {
      result = result.filter(room => room.facilities.bathroom === filters.bathroom);
    }
    
    if (filters.roomType) {
      result = result.filter(room => room.facilities.roomType === filters.roomType);
    }
    
    setFilteredRooms(result);
  }, [rooms, filters]);

  // Get rooms owned by the current user
  const getUserRooms = () => {
    if (!user) return [];
    return rooms.filter(room => room.ownerId === user.id);
  };

  // Update room availability
  const updateRoomAvailability = async (roomId: string, available: boolean): Promise<boolean> => {
    try {
      if (!user) {
        toast.error("Please sign in to update room availability");
        return false;
      }

      // Find the room to confirm ownership
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        toast.error("Room not found");
        return false;
      }

      if (room.ownerId !== user.id) {
        toast.error("You can only update your own rooms");
        return false;
      }

      // Update in Supabase
      const { error } = await supabase.rpc('update_room_availability', {
        room_id: roomId,
        is_available: available
      });

      if (error) {
        console.error('Error updating room availability:', error);
        toast.error("Failed to update room availability");
        return false;
      }

      // Update local state
      const updatedRooms = rooms.map(r => 
        r.id === roomId ? { ...r, available } : r
      );
      
      setRooms(updatedRooms);
      localStorage.setItem('livenzo_rooms', JSON.stringify(updatedRooms));
      
      toast.success(`Room ${available ? 'marked as available' : 'marked as unavailable'}`);
      return true;
    } catch (error: any) {
      console.error('Error in updateRoomAvailability:', error);
      toast.error(`Failed to update availability: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  const addRoom = async (roomData: Omit<Room, 'id' | 'createdAt'>) => {
    try {
      // Convert the room data to match the Supabase schema
      const supabaseRoomData = {
        title: roomData.title,
        description: roomData.description,
        images: roomData.images,
        price: roomData.price,
        location: roomData.location,
        facilities: roomData.facilities,
        owner_id: roomData.ownerId,
        owner_phone: roomData.ownerPhone,
        available: true // Default to available when creating
      };
      
      // If user is authenticated, save to Supabase
      if (user) {
        // Use raw RPC function to insert data
        const { data, error } = await supabase.rpc('insert_room', {
          room_data: supabaseRoomData
        });
        
        if (error) {
          console.error('Error adding room to Supabase:', error);
          toast.error("Failed to list room: " + error.message);
          return;
        }
        
        // Transform the returned data to match our Room interface
        const newRoom: Room = {
          id: data.id,
          title: data.title,
          description: data.description,
          images: data.images,
          price: data.price,
          location: data.location,
          facilities: data.facilities,
          ownerId: data.owner_id,
          ownerPhone: data.owner_phone,
          createdAt: data.created_at,
          available: true
        };
        
        // Update local state
        setRooms(prevRooms => [...prevRooms, newRoom]);
        
        // Update localStorage cache
        localStorage.setItem('livenzo_rooms', JSON.stringify([...rooms, newRoom]));
        
        toast.success("Room listed successfully!");
      } else {
        // If not authenticated, just use local storage
        const newRoom: Room = {
          ...roomData,
          id: 'local_' + Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString().split('T')[0],
          available: true
        };
        
        const updatedRooms = [...rooms, newRoom];
        setRooms(updatedRooms);
        localStorage.setItem('livenzo_rooms', JSON.stringify(updatedRooms));
        toast.success("Room listed successfully (locally)!");
        toast.info("Sign in to save your listings permanently.", {
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error('Error in addRoom:', error);
      toast.error(`Failed to list room: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <RoomContext.Provider value={{ 
      rooms, 
      filteredRooms, 
      filters, 
      setFilters, 
      addRoom,
      updateRoomAvailability,
      getUserRooms,
      isLoading 
    }}>
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
