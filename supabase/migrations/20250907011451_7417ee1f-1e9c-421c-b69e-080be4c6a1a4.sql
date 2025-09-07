-- Fix Security Definer View issues by ensuring all views use INVOKER rights (default)
-- and replacing any problematic SECURITY DEFINER functions with proper RLS policies

-- Check if there are any views with security definer issues
SELECT 
  schemaname, 
  viewname, 
  definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition ILIKE '%security definer%';

-- Drop any problematic views and recreate them properly
DROP VIEW IF EXISTS public.rooms_public_view CASCADE;

-- Recreate the rooms public view without any security definer issues
-- This view will respect the querying user's permissions and RLS policies
CREATE VIEW public.rooms_public_view AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.images,
  r.price,
  r.location,
  r.facilities,
  r.owner_id,
  'Contact via app' as owner_phone, -- Hide actual phone number for security
  r.created_at,
  COALESCE(r.available, true) as available,
  r.location_latitude,
  r.location_longitude,
  r.house_no,
  r.house_name
FROM public.rooms r
WHERE r.available = true;

-- Grant SELECT permissions to authenticated users only
GRANT SELECT ON public.rooms_public_view TO authenticated;

-- Remove any potential SECURITY DEFINER from functions that don't need it
-- Update the public rooms function to be more secure
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
SECURITY INVOKER  -- Use INVOKER instead of DEFINER for better security
SET search_path = public
AS $$
  -- Return data through the secure view that respects RLS
  SELECT 
    id, title, description, images, price, location, facilities, owner_id,
    'Contact via app' as owner_phone, -- Always hide phone numbers in public access
    created_at, available, location_latitude, location_longitude, house_no, house_name
  FROM public.rooms 
  WHERE available = true;
$$;

-- Update the authenticated room details function to also use SECURITY INVOKER
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
SECURITY INVOKER  -- Use INVOKER for better security
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