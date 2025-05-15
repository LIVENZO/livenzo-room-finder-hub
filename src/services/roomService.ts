
import { Room } from '@/types/room';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Helper function to safely parse JSON facilities
const parseFacilities = (facilitiesJson: any) => {
  try {
    // If it's already an object, return it
    if (facilitiesJson && typeof facilitiesJson === 'object' && !Array.isArray(facilitiesJson)) {
      return {
        wifi: Boolean(facilitiesJson.wifi),
        bathroom: Boolean(facilitiesJson.bathroom),
        gender: String(facilitiesJson.gender || 'any'),
        roomType: String(facilitiesJson.roomType || 'single')
      };
    }
    
    // If it's a string, try to parse it
    if (typeof facilitiesJson === 'string') {
      try {
        const parsed = JSON.parse(facilitiesJson);
        return {
          wifi: Boolean(parsed.wifi),
          bathroom: Boolean(parsed.bathroom),
          gender: String(parsed.gender || 'any'),
          roomType: String(parsed.roomType || 'single')
        };
      } catch (e) {
        console.error('Error parsing facilities JSON:', e);
      }
    }
    
    // Return default values if parsing fails
    return {
      wifi: false,
      bathroom: false,
      gender: 'any',
      roomType: 'single'
    };
  } catch (error) {
    console.error('Error processing facilities:', error);
    return {
      wifi: false,
      bathroom: false,
      gender: 'any',
      roomType: 'single'
    };
  }
};

// Fetch all rooms
export const fetchRooms = async (): Promise<Room[]> => {
  console.log('Fetching rooms...');
  
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching rooms:', error);
      toast.error(`Error fetching rooms: ${error.message}`);
      return [];
    }
    
    console.log(`Rooms fetched: ${data ? data.length : 0}`);
    
    // Map and transform the data to ensure proper typing
    return data ? data.map(room => ({
      ...room,
      facilities: parseFacilities(room.facilities),
      price: Number(room.price),
    })) : [];
    
  } catch (error) {
    console.error('Error in fetchRooms:', error);
    toast.error(`Failed to fetch rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};

// Add a new room
export const addRoomService = async (room: Omit<Room, 'id' | 'createdAt'>): Promise<Room | null> => {
  try {
    const newRoom = {
      ...room,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('rooms')
      .insert([newRoom])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding room:', error);
      toast.error(`Error adding room: ${error.message}`);
      return null;
    }
    
    return {
      ...data,
      facilities: parseFacilities(data.facilities),
      price: Number(data.price),
    };
    
  } catch (error) {
    console.error('Error in addRoomService:', error);
    toast.error(`Failed to add room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

// Update an existing room
export const updateRoomService = async (id: string, updates: Partial<Room>): Promise<Room | null> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating room:', error);
      toast.error(`Error updating room: ${error.message}`);
      return null;
    }
    
    return {
      ...data,
      facilities: parseFacilities(data.facilities),
      price: Number(data.price),
    };
    
  } catch (error) {
    console.error('Error in updateRoomService:', error);
    toast.error(`Failed to update room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

// Delete a room
export const deleteRoomService = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting room:', error);
      toast.error(`Error deleting room: ${error.message}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error in deleteRoomService:', error);
    toast.error(`Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Update room availability
export const updateRoomAvailabilityService = async (id: string, available: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('rooms')
      .update({ available })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating room availability:', error);
      toast.error(`Error updating availability: ${error.message}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error in updateRoomAvailabilityService:', error);
    toast.error(`Failed to update availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};
