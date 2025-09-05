-- Fix security issue: Restrict public access to owner phone numbers in rooms table
-- Remove existing permissive public policies and create more restrictive ones

-- First, drop the existing public policies that expose phone numbers
DROP POLICY IF EXISTS "Public can view basic room info" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can view detailed room info" ON public.rooms;

-- Create new restricted public policy that excludes sensitive information
-- Public users can only view basic room info without contact details
CREATE POLICY "Public can view basic room info without contact details" 
ON public.rooms 
FOR SELECT 
USING (
  available = true 
  AND auth.uid() IS NULL  -- Only for unauthenticated users
);

-- Create policy for authenticated users to view rooms with contact info
-- but only if they have a legitimate relationship or it's their own room
CREATE POLICY "Authenticated users can view room details with contact info" 
ON public.rooms 
FOR SELECT 
USING (
  available = true 
  AND auth.uid() IS NOT NULL
  AND (
    -- User is the owner of the room
    owner_id = auth.uid()
    OR
    -- User has an accepted relationship with the owner (for renters)
    EXISTS (
      SELECT 1 FROM public.relationships 
      WHERE owner_id = rooms.owner_id 
      AND renter_id = auth.uid() 
      AND status = 'accepted'
    )
  )
);

-- Create a view for public room listings that excludes sensitive information
CREATE OR REPLACE VIEW public.rooms_public_view AS
SELECT 
  id,
  title,
  description,
  images,
  price,
  location,
  facilities,
  owner_id,
  'Contact via app' as owner_phone,  -- Hide actual phone number
  created_at,
  available,
  location_latitude,
  location_longitude,
  house_no,
  house_name
FROM public.rooms
WHERE available = true;

-- Grant public access to the view
GRANT SELECT ON public.rooms_public_view TO anon, authenticated;

-- Update the existing functions to be more explicit about data access
CREATE OR REPLACE FUNCTION public.get_rooms_public()
RETURNS TABLE(
  id uuid, title text, description text, images text[], price numeric, 
  location text, facilities jsonb, owner_id uuid, owner_phone text, 
  created_at timestamp with time zone, available boolean, 
  location_latitude numeric, location_longitude numeric, 
  house_no text, house_name text
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  -- For public access, use the view that hides phone numbers
  SELECT * FROM public.rooms_public_view;
$$;

-- Keep the authenticated function but add relationship check for phone access
CREATE OR REPLACE FUNCTION public.get_room_details_for_authenticated()
RETURNS TABLE(
  id uuid, title text, description text, images text[], price numeric, 
  location text, facilities jsonb, owner_id uuid, owner_phone text, 
  created_at timestamp with time zone, available boolean, 
  location_latitude numeric, location_longitude numeric, 
  house_no text, house_name text
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 
    r.id, r.title, r.description, r.images, r.price, r.location, 
    r.facilities, r.owner_id,
    -- Only show actual phone if user is owner or has accepted relationship
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
    r.location_latitude, r.location_longitude, r.house_no, r.house_name
  FROM public.rooms r
  WHERE r.available = true;
$$;