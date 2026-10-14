import { Room, PropertyTypeFilter } from '@/types/room';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapDbRoomToRoom } from '@/utils/roomUtils';
import { securityAudit } from '@/services/security/securityAudit';
import { Hotspot } from '@/services/HotspotService';
import { RoomFilters, SearchFeedback } from '@/types/room';
import { parseSearchIntent, resolveSearchFilters } from '@/utils/searchIntent';

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
    const { data, error } = await supabase.rpc('get_public_room_listings');

    if (error) {
      console.error('Error fetching rooms:', error);
      toast.error(`Error fetching rooms: ${error.message}`);
      await securityAudit.logUnauthorizedAccess('rooms', 'fetch');
      return [];
    }

    const matchingRooms = (data ?? []).filter((room) => {
      if (propertyType === 'PG') return room.property_type === 'PG' || room.property_type === 'PG_HOSTEL';
      if (propertyType === 'Hostel') return room.property_type === 'Hostel' || room.property_type === 'PG_HOSTEL';
      if (propertyType === 'BHK') return room.property_type === 'BHK';
      return true;
    });

    console.log(`Rooms fetched: ${matchingRooms.length}`);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await securityAudit.logDataAccess('rooms', null, `fetch_${propertyType.toLowerCase()}`);
    }

    return matchingRooms.map((room) => mapDbRoomToRoom(room));
  } catch (error) {
    console.error('Error in fetchRooms:', error);
    toast.error(`Failed to fetch rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
};

interface SearchRoomsResult {
  rooms: Room[];
  feedback: SearchFeedback;
}

export const searchRooms = async (
  query: string,
  filters: RoomFilters,
  hotspots: Hotspot[],
): Promise<SearchRoomsResult> => {
  const intent = parseSearchIntent(query, hotspots);
  const resolved = resolveSearchFilters(intent, filters);

  if (resolved.conflict) {
    return {
      rooms: [],
      feedback: {
        mode: 'none',
        message: 'Your search and selected filters conflict.',
        suggestions: ['Change the property type or suitability filter', 'Clear filters and search again'],
      },
    };
  }

  const effective = resolved.filters;
  const propertyType = effective.propertyType && effective.propertyType !== 'all'
    ? effective.propertyType
    : undefined;
  const baseArgs = {
    p_query: intent.normalizedQuery || undefined,
    p_property_type: propertyType,
    p_gender: effective.gender,
    p_max_price: effective.maxPrice,
    p_room_type: effective.roomType,
    p_wifi: effective.wifi,
    p_bathroom: effective.bathroom,
    p_cooling_type: effective.coolingType,
    p_food: effective.food,
    p_location_query: intent.locationQuery,
    p_hotspot_latitude: intent.hotspot?.latitude,
    p_hotspot_longitude: intent.hotspot?.longitude,
    p_limit: 200,
    p_offset: 0,
  };

  const runSearch = async (relaxLocation: boolean) => {
    const { data, error } = await supabase.rpc('search_public_room_listings', {
      ...baseArgs,
      p_relax_location: relaxLocation,
    });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...mapDbRoomToRoom(row),
      distance: row.distance_km == null ? undefined : Number(row.distance_km),
    }));
  };

  try {
    let rooms = await runSearch(false);
    let feedback: SearchFeedback = { mode: 'strict' };

    if (rooms.length === 0 && intent.locationQuery) {
      rooms = await runSearch(true);
      if (rooms.length > 0) {
        feedback = {
          mode: 'nearby',
          message: `No exact matches in ${intent.locationQuery}. Showing eligible options in nearby Kota areas.`,
        };
      }
    }

    if (intent.affordable) {
      rooms = [...rooms].sort((a, b) => a.price - b.price);
    }

    if (rooms.length === 0) {
      feedback = {
        mode: 'none',
        message: 'No available properties match every requirement.',
        suggestions: [
          intent.locationQuery ? 'Try a nearby Kota locality' : 'Try adding a Kota locality',
          effective.maxPrice ? 'Increase the maximum monthly budget' : 'Remove a non-essential amenity filter',
        ],
      };
    }

    return { rooms, feedback };
  } catch (error) {
    console.error('Structured room search failed:', error);
    throw error;
  }
};
