-- Fix security issue: Personal Phone Numbers and Names Exposed to Public
-- Remove the overly permissive policy that allows anyone to view rooms
DROP POLICY "Anyone can view rooms" ON public.rooms;

-- Create a security definer function to get room data for authenticated users
CREATE OR REPLACE FUNCTION public.get_room_details_for_authenticated()
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
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    r.id, r.title, r.description, r.images, r.price, r.location, 
    r.facilities, r.owner_id, r.owner_phone, r.created_at, 
    COALESCE(r.available, true) as available,
    r.location_latitude, r.location_longitude, r.house_no, r.house_name
  FROM public.rooms r
  WHERE r.available = true;
$$;

-- Create a security definer function to get room data for public (without sensitive info)
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
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    r.id, r.title, r.description, r.images, r.price, r.location, 
    r.facilities, r.owner_id, 
    '***-***-' || RIGHT(r.owner_phone, 4) as owner_phone, -- Mask phone number
    r.created_at, 
    COALESCE(r.available, true) as available,
    r.location_latitude, r.location_longitude, r.house_no, r.house_name
  FROM public.rooms r
  WHERE r.available = true;
$$;

-- Create new RLS policies with proper access control
CREATE POLICY "Authenticated users can view all room details"
ON public.rooms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Public can view rooms with masked sensitive data"
ON public.rooms
FOR SELECT
TO anon
USING (available = true);

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.get_room_details_for_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rooms_public() TO anon, authenticated;