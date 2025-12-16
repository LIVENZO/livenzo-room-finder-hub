-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_rooms_public();
DROP FUNCTION IF EXISTS public.get_room_details_for_authenticated();

-- Recreate get_rooms_public with videos column
CREATE OR REPLACE FUNCTION public.get_rooms_public()
 RETURNS TABLE(id uuid, title text, description text, images text[], price numeric, location text, facilities jsonb, owner_id uuid, owner_phone text, created_at timestamp with time zone, available boolean, location_latitude numeric, location_longitude numeric, house_no text, house_name text, videos text[])
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT 
    id, title, description, images, price, location, facilities, owner_id,
    'Contact via app' as owner_phone,
    created_at, available, location_latitude, location_longitude, house_no, house_name, videos
  FROM public.rooms 
  WHERE available = true;
$function$;

-- Recreate get_room_details_for_authenticated with videos column
CREATE OR REPLACE FUNCTION public.get_room_details_for_authenticated()
 RETURNS TABLE(id uuid, title text, description text, images text[], price numeric, location text, facilities jsonb, owner_id uuid, owner_phone text, created_at timestamp with time zone, available boolean, location_latitude numeric, location_longitude numeric, house_no text, house_name text, videos text[])
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT 
    r.id, r.title, r.description, r.images, r.price, r.location, 
    r.facilities, r.owner_id,
    CASE 
      WHEN r.owner_id = auth.uid() THEN r.owner_phone
      WHEN EXISTS (
        SELECT 1 FROM public.relationships 
        WHERE owner_id = r.owner_id 
        AND renter_id = auth.uid() 
        AND status = 'accepted'
      ) THEN r.owner_phone
      ELSE 'Contact via app'
    END as owner_phone,
    r.created_at, 
    COALESCE(r.available, true) as available,
    r.location_latitude, r.location_longitude, r.house_no, r.house_name, r.videos
  FROM public.rooms r
  WHERE r.available = true;
$function$;