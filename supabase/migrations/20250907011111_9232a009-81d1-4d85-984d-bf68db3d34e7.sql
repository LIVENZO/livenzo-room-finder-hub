-- Fix the security definer view issue by removing SECURITY DEFINER from view
-- Views should not use SECURITY DEFINER as it bypasses RLS

-- Drop the existing view
DROP VIEW IF EXISTS public.rooms_public_view;

-- Recreate the view without SECURITY DEFINER (this is implied and not needed for views)
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
  'Contact via app' as owner_phone, -- Hide actual phone number
  r.created_at,
  COALESCE(r.available, true) as available,
  r.location_latitude,
  r.location_longitude,
  r.house_no,
  r.house_name
FROM public.rooms r
WHERE r.available = true;

-- Create RLS policy for the view access
CREATE POLICY "Public can view rooms through secure view" 
ON public.rooms 
FOR SELECT 
USING (available = true AND auth.uid() IS NOT NULL);

-- Grant appropriate permissions on the view
GRANT SELECT ON public.rooms_public_view TO authenticated;
GRANT SELECT ON public.rooms_public_view TO anon;