-- Check for any remaining views with security definer issues
-- The linter may be detecting views that reference SECURITY DEFINER functions

-- Check all views in the public schema
SELECT 
  schemaname, 
  viewname, 
  definition 
FROM pg_views 
WHERE schemaname = 'public';

-- Drop and recreate the safe profile function without SECURITY DEFINER
-- since it doesn't need elevated privileges for basic profile access
DROP FUNCTION IF EXISTS public.get_safe_profile_data(uuid);

-- Create a simple view for safe profile data instead of a SECURITY DEFINER function
CREATE OR REPLACE VIEW public.safe_profile_view AS
SELECT 
  up.id,
  up.full_name,
  up.avatar_url,
  up.public_id,
  up.accommodation_type,
  up.property_name,
  up.resident_type
FROM public.user_profiles up;

-- Grant appropriate permissions
GRANT SELECT ON public.safe_profile_view TO authenticated;

-- The rooms_public_view should already be created correctly, but let's verify it exists
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname = 'rooms_public_view';