import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';

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
  addRoom: (room: Omit<Room, 'id' | 'createdAt'>) => void;
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

  // Initialize with sample data
  useEffect(() => {
    const savedRooms = localStorage.getItem('livenzo_rooms');
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms));
    } else {
      setRooms(sampleRooms);
      localStorage.setItem('livenzo_rooms', JSON.stringify(sampleRooms));
    }
    setIsLoading(false);
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

  const addRoom = (roomData: Omit<Room, 'id' | 'createdAt'>) => {
    const newRoom: Room = {
      ...roomData,
      id: 'room_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    localStorage.setItem('livenzo_rooms', JSON.stringify(updatedRooms));
    toast.success("Room listed successfully!");
  };

  return (
    <RoomContext.Provider value={{ 
      rooms, 
      filteredRooms, 
      filters, 
      setFilters, 
      addRoom, 
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
