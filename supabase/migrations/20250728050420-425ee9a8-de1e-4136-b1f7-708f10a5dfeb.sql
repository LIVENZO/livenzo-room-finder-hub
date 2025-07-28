-- Create trigger to handle user role assignment on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_role_assignment();

-- Also update the existing function to handle the selected role better
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
  google_sub := NEW.raw_user_meta_data ->> 'sub';
  selected_role := NEW.raw_user_meta_data ->> 'role';
  
  -- If no role specified in metadata, check app_metadata
  IF selected_role IS NULL THEN
    selected_role := NEW.app_metadata ->> 'role';
  END IF;
  
  -- If still no role, default to 'renter'
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

-- Create a function to check role conflicts before allowing sign-in
CREATE OR REPLACE FUNCTION public.check_google_role_conflict(
  google_id_param TEXT,
  email_param TEXT,
  requested_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_role TEXT;
BEGIN
  -- Check if this Google ID already has a different role
  IF google_id_param IS NOT NULL THEN
    SELECT role INTO existing_role
    FROM public.user_role_assignments
    WHERE google_id = google_id_param
    AND role != requested_role
    LIMIT 1;
    
    IF existing_role IS NOT NULL THEN
      RETURN TRUE; -- Conflict found
    END IF;
  END IF;
  
  -- Also check by email as fallback
  IF email_param IS NOT NULL THEN
    SELECT role INTO existing_role
    FROM public.user_role_assignments
    WHERE email = email_param
    AND role != requested_role
    LIMIT 1;
    
    IF existing_role IS NOT NULL THEN
      RETURN TRUE; -- Conflict found
    END IF;
  END IF;
  
  RETURN FALSE; -- No conflict
END;
$function$;