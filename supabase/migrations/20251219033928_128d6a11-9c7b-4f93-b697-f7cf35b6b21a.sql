-- Drop and recreate get_rooms_public with owner location fallback
DROP FUNCTION IF EXISTS public.get_rooms_public();

CREATE OR REPLACE FUNCTION public.get_rooms_public()
RETURNS TABLE(
  id uuid, 
  title text, 
  description text, 
  images text[], 
  price numeric, 
  location text, 
  facilities jsonb, 
  owner_id uuid, 
  owner_phone text, 
  created_at timestamp with time zone, 
  available boolean, 
  location_latitude numeric, 
  location_longitude numeric, 
  house_no text, 
  house_name text, 
  videos text[]
)
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT 
    r.id, 
    r.title, 
    r.description, 
    r.images, 
    r.price, 
    r.location, 
    r.facilities, 
    r.owner_id,
    'Contact via app' as owner_phone,
    r.created_at, 
    r.available,
    -- Fallback to owner's location if room location is NULL
    COALESCE(r.location_latitude, up.location_latitude) as location_latitude,
    COALESCE(r.location_longitude, up.location_longitude) as location_longitude,
    r.house_no, 
    r.house_name, 
    r.videos
  FROM public.rooms r
  LEFT JOIN public.user_profiles up ON r.owner_id = up.id
  WHERE r.available = true;
$$;

-- Drop and recreate get_room_details_for_authenticated with owner location fallback
DROP FUNCTION IF EXISTS public.get_room_details_for_authenticated();

CREATE OR REPLACE FUNCTION public.get_room_details_for_authenticated()
RETURNS TABLE(
  id uuid, 
  title text, 
  description text, 
  images text[], 
  price numeric, 
  location text, 
  facilities jsonb, 
  owner_id uuid, 
  owner_phone text, 
  created_at timestamp with time zone, 
  available boolean, 
  location_latitude numeric, 
  location_longitude numeric, 
  house_no text, 
  house_name text, 
  videos text[]
)
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT 
    r.id, 
    r.title, 
    r.description, 
    r.images, 
    r.price, 
    r.location, 
    r.facilities, 
    r.owner_id,
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
    -- Fallback to owner's location if room location is NULL
    COALESCE(r.location_latitude, up.location_latitude) as location_latitude,
    COALESCE(r.location_longitude, up.location_longitude) as location_longitude,
    r.house_no, 
    r.house_name, 
    r.videos
  FROM public.rooms r
  LEFT JOIN public.user_profiles up ON r.owner_id = up.id
  WHERE r.available = true;
$$;