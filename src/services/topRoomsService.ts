import { supabase } from '@/integrations/supabase/client';

let cachedTopRoomIds: string[] | null = null;

export const fetchTopRoomIds = async (): Promise<string[]> => {
  if (cachedTopRoomIds) return cachedTopRoomIds;

  try {
    const { data, error } = await supabase
      .from('top_rooms')
      .select('room_id');

    if (error || !data) {
      console.error('Error fetching top rooms:', error);
      return [];
    }

    cachedTopRoomIds = data.map(r => r.room_id);
    // Invalidate cache after 5 minutes
    setTimeout(() => { cachedTopRoomIds = null; }, 5 * 60 * 1000);
    return cachedTopRoomIds;
  } catch {
    return [];
  }
};

export const invalidateTopRoomsCache = () => {
  cachedTopRoomIds = null;
};
