CREATE OR REPLACE FUNCTION public.get_public_room_listings()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  images text[],
  videos text[],
  price numeric,
  location text,
  facilities jsonb,
  owner_id uuid,
  owner_phone text,
  created_at timestamptz,
  updated_at timestamptz,
  available boolean,
  location_latitude numeric,
  location_longitude numeric,
  house_no text,
  house_name text,
  maximum_price numeric,
  minimum_price numeric,
  property_type text,
  pg_rent numeric,
  hostel_rent numeric,
  is_top_room boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.title,
    r.description,
    COALESCE(r.images, ARRAY[]::text[]),
    COALESCE(r.videos, ARRAY[]::text[]),
    r.price,
    r.location,
    r.facilities,
    r.owner_id,
    'Contact via app'::text,
    r.created_at,
    r.updated_at,
    COALESCE(r.available, true),
    r.location_latitude,
    r.location_longitude,
    r.house_no,
    r.house_name,
    r.maximum_price,
    r.minimum_price,
    r.property_type,
    r.pg_rent,
    r.hostel_rent,
    COALESCE(r.is_top_room, false)
  FROM public.rooms AS r
  WHERE r.available = true
  ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_public_room_listings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_room_listings() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_room_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_room_listings() TO service_role;

COMMENT ON FUNCTION public.get_public_room_listings() IS
  'Returns safe, non-sensitive fields for available public room listings. Owner phone numbers are always masked.';