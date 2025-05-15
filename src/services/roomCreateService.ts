
import { Room } from '@/types/room';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { mapDbRoomToRoom } from '@/utils/roomUtils';

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
    return mapDbRoomToRoom(data);
    
  } catch (error) {
    console.error('Error in addRoomService:', error);
    toast.error(`Failed to add room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};
