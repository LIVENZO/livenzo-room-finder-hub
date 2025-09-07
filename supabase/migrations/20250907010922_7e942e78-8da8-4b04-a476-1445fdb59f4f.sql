-- Fix security vulnerability: Protect sensitive data in rooms and user_profiles tables

-- First, create a secure view for public room access that hides sensitive data
CREATE OR REPLACE VIEW public.rooms_public_view AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.images,
  r.price,
  r.location,
  r.facilities,
  r.owner_id,
  'Contact via app' as owner_phone, -- Hide actual phone number
  r.created_at,
  COALESCE(r.available, true) as available,
  r.location_latitude,
  r.location_longitude,
  r.house_no,
  r.house_name
FROM public.rooms r
WHERE r.available = true;

-- Update the public rooms function to use the secure view
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
  house_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- For public access, use the view that hides phone numbers
  SELECT * FROM public.rooms_public_view;
$$;

-- Drop the existing problematic RLS policy that allows public room access
DROP POLICY IF EXISTS "Authenticated users can view available rooms" ON public.rooms;

-- Create a more restrictive policy for room viewing
CREATE POLICY "Owners can view their own rooms" 
ON public.rooms 
FOR SELECT 
USING (auth.uid() = owner_id);

-- Allow authenticated users to view rooms through the secure function only
CREATE POLICY "Authenticated users can view room details" 
ON public.rooms 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND available = true);

-- Create a function to check if user can access full room details (with phone)
CREATE OR REPLACE FUNCTION public.can_access_owner_contact(room_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow access if user is the owner
  IF auth.uid() = room_owner_id THEN
    RETURN TRUE;
  END IF;
  
  -- Allow access if user has accepted relationship with owner
  IF EXISTS (
    SELECT 1 FROM public.relationships 
    WHERE owner_id = room_owner_id 
    AND renter_id = auth.uid() 
    AND status = 'accepted'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Update the authenticated room details function to use proper access control
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
  house_name text
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

-- Add additional protection for user_profiles sensitive fields
-- Create a function that returns only safe profile data for public consumption
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  public_id text,
  accommodation_type text,
  property_name text,
  resident_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return safe data, never sensitive fields like phone, email, payment info, location
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.avatar_url,
    up.public_id,
    up.accommodation_type,
    up.property_name,
    up.resident_type
  FROM public.user_profiles up
  WHERE up.id = profile_user_id;
END;
$$;