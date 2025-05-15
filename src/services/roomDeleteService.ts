
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
