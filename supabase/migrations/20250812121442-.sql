-- Fix typo in timestampz -> timestamptz
DROP FUNCTION IF EXISTS public.get_rooms_public();

CREATE OR REPLACE FUNCTION public.get_rooms_public()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  images text[],
  price numeric,
  location text,
  facilities jsonb,
  owner_id uuid,
  owner_phone text,
  created_at timestamptz,
  available boolean,
  location_latitude numeric,
  location_longitude numeric,
  house_no text,
  house_name text
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
  SELECT 
    r.id, r.title, r.description, r.images, r.price, r.location, 
    r.facilities, r.owner_id, 
    '***-***-' || RIGHT(r.owner_phone, 4) as owner_phone,
    r.created_at, 
    COALESCE(r.available, true) as available,
    r.location_latitude, r.location_longitude, r.house_no, r.house_name
  FROM public.rooms r
  WHERE r.available = true;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_rooms_public() TO anon, authenticated;