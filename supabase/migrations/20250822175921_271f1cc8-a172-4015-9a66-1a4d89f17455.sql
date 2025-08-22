-- Fix critical security vulnerabilities

-- 1. Fix user_profiles RLS policy bug - the policy was comparing relationships.id with relationships.id instead of user_profiles.id
DROP POLICY IF EXISTS "Connected users can view basic profile info" ON public.user_profiles;

CREATE POLICY "Connected users can view basic profile info" 
ON public.user_profiles 
FOR SELECT 
USING (
  (auth.uid() <> id) AND (
    (EXISTS (
      SELECT 1 FROM public.relationships 
      WHERE relationships.owner_id = auth.uid() 
        AND relationships.renter_id = user_profiles.id 
        AND relationships.status = 'accepted'
    )) OR 
    (EXISTS (
      SELECT 1 FROM public.relationships 
      WHERE relationships.renter_id = auth.uid() 
        AND relationships.owner_id = user_profiles.id 
        AND relationships.status = 'accepted'
    ))
  )
);

-- 2. Enhanced phone number protection for rooms
-- Update the public function to completely hide phone numbers for non-authenticated users
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
SET search_path = 'public'
AS $function$
  SELECT 
    r.id, r.title, r.description, r.images, r.price, r.location, 
    r.facilities, r.owner_id, 
    'Contact via app' as owner_phone,  -- Hide phone completely for public
    r.created_at, 
    COALESCE(r.available, true) as available,
    r.location_latitude, r.location_longitude, r.house_no, r.house_name
  FROM public.rooms r
  WHERE r.available = true;
$function$;

-- 3. Add additional security function to validate sensitive data access
CREATE OR REPLACE FUNCTION public.can_access_user_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Users can always access their own profile
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if users have an accepted relationship
  RETURN EXISTS (
    SELECT 1 FROM public.relationships 
    WHERE (
      (owner_id = auth.uid() AND renter_id = target_user_id) OR
      (renter_id = auth.uid() AND owner_id = target_user_id)
    ) AND status = 'accepted'
  );
END;
$function$;

-- 4. Add function to log sensitive data access attempts
CREATE OR REPLACE FUNCTION public.log_profile_access_attempt(target_user_id uuid, access_granted boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log the access attempt
  PERFORM public.log_security_event(
    auth.uid(),
    'profile_access_attempt',
    'user_profiles',
    target_user_id,
    jsonb_build_object(
      'access_granted', access_granted,
      'target_user_id', target_user_id
    ),
    CASE WHEN access_granted THEN 'low' ELSE 'medium' END
  );
END;
$function$;