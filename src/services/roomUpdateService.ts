
import { Room } from '@/types/room';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDbRoomToRoom } from '@/utils/roomUtils';

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
    return mapDbRoomToRoom(data);
    
  } catch (error) {
    console.error('Error in updateRoomService:', error);
    toast.error(`Failed to update room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
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
