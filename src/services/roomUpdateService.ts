
import { supabase } from '@/integrations/supabase/client';
import { Room } from '@/types/room';
import { parseFacilities, mapDbRoomToRoom } from '@/utils/roomUtils';
import { toast } from 'sonner';

// Update a room's details
export const updateRoomService = async (id: string, updates: Partial<Room>): Promise<Room | null> => {
  try {
    // Convert the room object to DB format
    const roomDbUpdates: any = { ...updates };
    
    // Handle special fields
    if (updates.facilities) {
      roomDbUpdates.facilities = updates.facilities;
    }
    
    // Exclude any non-DB fields
    delete roomDbUpdates.id;
    delete roomDbUpdates.createdAt;
    
    // Update the room
    const { data, error } = await supabase
      .from('rooms')
      .update(roomDbUpdates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update room');
      return null;
    }
    
    // Map the DB response to our Room type
    return mapDbRoomToRoom(data);
  } catch (error) {
    console.error('Unexpected error in updateRoomService:', error);
    toast.error('An unexpected error occurred');
    return null;
  }
};

// Update a room's availability using the specialized function
export const updateRoomAvailabilityService = async (roomId: string, available: boolean): Promise<boolean> => {
  try {
    // Use our database function to update availability
    const { error } = await supabase
      .rpc('update_room_availability', {
        room_id: roomId,
        is_available: available
      });
    
    if (error) {
      console.error('Error updating room availability:', error);
      toast.error('Failed to update room availability');
      return false;
    }
    
    toast.success(`Room ${available ? 'marked as available' : 'marked as unavailable'}`);
    return true;
  } catch (error) {
    console.error('Unexpected error in updateRoomAvailabilityService:', error);
    toast.error('An unexpected error occurred');
    return false;
  }
};
