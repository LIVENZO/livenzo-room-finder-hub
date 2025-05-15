
import { Room } from '@/types/room';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// Helper function to safely parse JSON facilities
const parseFacilities = (facilitiesJson: any): Room['facilities'] => {
  try {
    // If it's already an object, return it
    if (facilitiesJson && typeof facilitiesJson === 'object' && !Array.isArray(facilitiesJson)) {
      return {
        wifi: Boolean(facilitiesJson.wifi),
        bathroom: Boolean(facilitiesJson.bathroom),
        gender: (facilitiesJson.gender || 'any') as 'male' | 'female' | 'any',
        roomType: (facilitiesJson.roomType || 'single') as 'single' | 'sharing'
      };
    }
    
    // If it's a string, try to parse it
    if (typeof facilitiesJson === 'string') {
      try {
        const parsed = JSON.parse(facilitiesJson);
        return {
          wifi: Boolean(parsed.wifi),
          bathroom: Boolean(parsed.bathroom),
          gender: (parsed.gender || 'any') as 'male' | 'female' | 'any',
          roomType: (parsed.roomType || 'single') as 'single' | 'sharing'
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
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching rooms:', error);
      toast.error(`Error fetching rooms: ${error.message}`);
      return [];
    }
    
    console.log(`Rooms fetched: ${data ? data.length : 0}`);
    
    // Map and transform the data to ensure proper typing
    return data ? data.map(room => ({
      id: room.id,
      title: room.title,
      description: room.description,
      images: room.images || [],
      price: Number(room.price),
      location: room.location,
      facilities: parseFacilities(room.facilities),
      ownerId: room.owner_id,
      ownerPhone: room.owner_phone,
      available: room.available,
      createdAt: room.created_at
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
    // Map the Room type to the database schema structure
    const newRoomData = {
      id: uuidv4(),
      title: room.title,
      description: room.description,
      images: room.images,
      price: room.price,
      location: room.location,
      facilities: room.facilities,
      owner_id: room.ownerId,
      owner_phone: room.ownerPhone,
      available: room.available !== undefined ? room.available : true,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('rooms')
      .insert([newRoomData])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding room:', error);
      toast.error(`Error adding room: ${error.message}`);
      return null;
    }
    
    // Map the database response back to the Room type
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      images: data.images || [],
      price: Number(data.price),
      location: data.location,
      facilities: parseFacilities(data.facilities),
      ownerId: data.owner_id,
      ownerPhone: data.owner_phone,
      available: data.available,
      createdAt: data.created_at
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
    // Map the Room type updates to the database schema structure
    const dbUpdates: any = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.images) dbUpdates.images = updates.images;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.location) dbUpdates.location = updates.location;
    if (updates.facilities) dbUpdates.facilities = updates.facilities;
    if (updates.ownerId) dbUpdates.owner_id = updates.ownerId;
    if (updates.ownerPhone) dbUpdates.owner_phone = updates.ownerPhone;
    if (updates.available !== undefined) dbUpdates.available = updates.available;
    
    const { data, error } = await supabase
      .from('rooms')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating room:', error);
      toast.error(`Error updating room: ${error.message}`);
      return null;
    }
    
    // Map the database response back to the Room type
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      images: data.images || [],
      price: Number(data.price),
      location: data.location,
      facilities: parseFacilities(data.facilities),
      ownerId: data.owner_id,
      ownerPhone: data.owner_phone,
      available: data.available,
      createdAt: data.created_at
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
