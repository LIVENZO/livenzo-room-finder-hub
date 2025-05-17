
import { Room } from '@/types/room';
import { supabase } from '@/integrations/supabase/client'; 
import { toast } from 'sonner';
import { parseFacilities, mapDbRoomToRoom } from '@/utils/roomUtils';

// Re-export room fetch service 
export { fetchRooms } from './roomFetchService';

// Create a new room listing
export const createRoom = async (roomData: Partial<Room>, imageUrls: string[]): Promise<Room | null> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        title: roomData.title,
        description: roomData.description,
        location: roomData.location,
        price: roomData.price,
        facilities: roomData.facilities,
        owner_id: roomData.ownerId,
        owner_phone: roomData.ownerPhone,
        images: imageUrls,
        available: true
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating room:', error);
      toast.error(`Failed to create room: ${error.message}`);
      return null;
    }
    
    return mapDbRoomToRoom(data);
  } catch (error) {
    console.error('Error in createRoom:', error);
    toast.error(`Error creating room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

// Update a room listing
export const updateRoom = async (id: string, updates: Partial<Room>): Promise<Room | null> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        title: updates.title,
        description: updates.description,
        location: updates.location,
        price: updates.price,
        facilities: updates.facilities,
        owner_phone: updates.ownerPhone,
        images: updates.images,
        available: updates.available
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating room:', error);
      toast.error(`Failed to update room: ${error.message}`);
      return null;
    }
    
    return mapDbRoomToRoom(data);
  } catch (error) {
    console.error('Error in updateRoom:', error);
    toast.error(`Error updating room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

// Delete a room listing
export const deleteRoom = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting room:', error);
      toast.error(`Failed to delete room: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteRoom:', error);
    toast.error(`Error deleting room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Update room availability
export const updateRoomAvailability = async (id: string, isAvailable: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('rooms')
      .update({ available: isAvailable })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating room availability:', error);
      toast.error(`Failed to update availability: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateRoomAvailability:', error);
    toast.error(`Error updating availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

// Also re-export any utility functions that might be needed elsewhere
export { parseFacilities, mapDbRoomToRoom } from '@/utils/roomUtils';
