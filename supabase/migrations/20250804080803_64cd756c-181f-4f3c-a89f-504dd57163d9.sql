-- Fix the user role assignment trigger to handle phone OTP sign-ups
CREATE OR REPLACE FUNCTION public.handle_user_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  selected_role TEXT;
  google_sub TEXT;
BEGIN
  -- Extract Google ID if available (for OAuth flows)
  google_sub := NEW.raw_user_meta_data ->> 'sub';
  
  -- Try to get role from raw_user_meta_data first
  selected_role := NEW.raw_user_meta_data ->> 'role';
  
  -- Try to get role from app_metadata if it exists and is not null
  IF selected_role IS NULL AND NEW.app_metadata IS NOT NULL THEN
    selected_role := NEW.app_metadata ->> 'role';
  END IF;
  
  -- Default to 'renter' if no role is specified
  IF selected_role IS NULL THEN
    selected_role := 'renter';
  END IF;
  
  -- Insert the role assignment
  INSERT INTO public.user_role_assignments (user_id, email, role, google_id)
  VALUES (NEW.id, NEW.email, selected_role, google_sub)
  ON CONFLICT (email, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Ensure user_profiles table has proper structure for phone OTP users
-- The id column should allow manual setting for auth.users.id
ALTER TABLE public.user_profiles ALTER COLUMN id SET DEFAULT NULL;

-- Add a trigger to auto-populate user_profiles when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert a basic profile for the new user
  INSERT INTO public.user_profiles (id, created_at, updated_at)
  VALUES (NEW.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Ensure RLS policies are correct for user_profiles
DROP POLICY IF EXISTS "Allow insert for new users" ON public.user_profiles;
CREATE POLICY "Allow insert for new users" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add policy to allow users to insert their own profile with specific ID
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);