import { Room, PropertyTypeFilter } from '@/types/room';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDbRoomToRoom } from '@/utils/roomUtils';
import { securityAudit } from '@/services/security/securityAudit';

const ROOM_LIST_SELECT = `
  id,
  title,
  description,
  images,
  videos,
  price,
  location,
  facilities,
  owner_id,
  created_at,
  available,
  location_latitude,
  location_longitude,
  house_no,
  house_name,
  maximum_price,
  minimum_price,
  property_type,
  pg_rent,
  hostel_rent,
  is_top_room
`;

// Fetch rooms with optional property type filtering applied in Supabase
export const fetchRooms = async (propertyType: PropertyTypeFilter = 'all'): Promise<Room[]> => {
  console.log('Fetching rooms...', { propertyType });

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    let query = supabase
      .from('rooms')
      .select(ROOM_LIST_SELECT)
      .eq('available', true)
      .order('created_at', { ascending: false });

    if (propertyType === 'PG') {
      query = query.or('property_type.eq.PG,property_type.eq.PG_HOSTEL');
    } else if (propertyType === 'Hostel') {
      query = query.or('property_type.eq.Hostel,property_type.eq.PG_HOSTEL');
    } else if (propertyType === 'BHK') {
      query = query.eq('property_type', 'BHK');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rooms:', error);
      toast.error(`Error fetching rooms: ${error.message}`);
      await securityAudit.logUnauthorizedAccess('rooms', 'fetch');
      return [];
    }

    console.log(`Rooms fetched: ${data ? data.length : 0}`);
    await securityAudit.logDataAccess('rooms', null, `fetch_${propertyType.toLowerCase()}`);

    return data ? data.map((room) => mapDbRoomToRoom(room)) : [];
  } catch (error) {
    console.error('Error in fetchRooms:', error);
    toast.error(`Failed to fetch rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};
