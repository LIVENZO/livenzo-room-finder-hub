-- Final fix for Security Definer View warnings
-- The issue may be that the linter is detecting views that call or reference SECURITY DEFINER functions
-- Let's ensure our views are completely independent and don't reference any SECURITY DEFINER functions

-- Enable RLS on views explicitly (this might be what the linter is looking for)
-- Note: PostgreSQL views don't directly have RLS, but they inherit from underlying tables

-- Make sure our views have explicit security context
-- Drop and recreate all views with explicit security documentation

DROP VIEW IF EXISTS public.rooms_public_view CASCADE;
DROP VIEW IF EXISTS public.safe_profile_view CASCADE;

-- Create rooms public view with explicit security context
-- This view provides safe access to room data without exposing sensitive information
CREATE VIEW public.rooms_public_view 
WITH (security_barrier = true) AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.images,
  r.price,
  r.location,
  r.facilities,
  r.owner_id,
  'Contact via app'::text AS owner_phone, -- Static text, no function calls
  r.created_at,
  COALESCE(r.available, true) AS available,
  r.location_latitude,
  r.location_longitude,
  r.house_no,
  r.house_name
FROM public.rooms r
WHERE r.available = true;

-- Create safe profile view with explicit security context
CREATE VIEW public.safe_profile_view 
WITH (security_barrier = true) AS
SELECT 
  up.id,
  up.full_name,
  up.avatar_url,
  up.public_id,
  up.accommodation_type,
  up.property_name,
  up.resident_type
FROM public.user_profiles up;

-- Grant permissions explicitly
GRANT SELECT ON public.rooms_public_view TO authenticated;
GRANT SELECT ON public.safe_profile_view TO authenticated;

-- Add comments to document security considerations
COMMENT ON VIEW public.rooms_public_view IS 'Secure view that provides public room data without exposing sensitive phone numbers. Uses security_barrier to ensure safe access.';
COMMENT ON VIEW public.safe_profile_view IS 'Secure view that provides safe profile data without exposing sensitive information like phone numbers, emails, or payment details.';