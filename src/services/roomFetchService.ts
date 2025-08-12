
import { Room } from '@/types/room';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDbRoomToRoom } from '@/utils/roomUtils';

// Fetch all rooms using secure functions based on authentication status
export const fetchRooms = async (): Promise<Room[]> => {
  console.log('Fetching rooms...');
  
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use appropriate function based on authentication status
    const functionName = user ? 'get_room_details_for_authenticated' : 'get_rooms_public';
    
    const { data, error } = await supabase
      .rpc(functionName)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching rooms:', error);
      toast.error(`Error fetching rooms: ${error.message}`);
      return [];
    }
    
    console.log(`Rooms fetched: ${data ? data.length : 0}`);
    
    // Map and transform the data to ensure proper typing
    return data ? data.map(room => mapDbRoomToRoom(room)) : [];
    
  } catch (error) {
    console.error('Error in fetchRooms:', error);
    toast.error(`Failed to fetch rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};
