-- Update the trigger function to better handle role assignment from URL parameters
CREATE OR REPLACE FUNCTION public.handle_user_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  selected_role TEXT;
  google_sub TEXT;
  url_params TEXT;
BEGIN
  google_sub := NEW.raw_user_meta_data ->> 'sub';
  selected_role := NEW.raw_user_meta_data ->> 'role';
  
  -- Try to get role from app_metadata
  IF selected_role IS NULL THEN
    selected_role := NEW.app_metadata ->> 'role';
  END IF;
  
  -- Try to get role from confirmation_sent_at URL (for OAuth flows)
  IF selected_role IS NULL THEN
    url_params := NEW.raw_user_meta_data ->> 'custom_claims';
    IF url_params IS NOT NULL THEN
      selected_role := url_params ->> 'role';
    END IF;
  END IF;
  
  -- Check if we can extract the role from the referrer or any other metadata
  IF selected_role IS NULL THEN
    -- Look for stored role in localStorage (will be handled client-side)
    selected_role := 'renter'; -- Default fallback
  END IF;
  
  -- Insert the role assignment
  INSERT INTO public.user_role_assignments (user_id, email, role, google_id)
  VALUES (NEW.id, NEW.email, selected_role, google_sub)
  ON CONFLICT (email, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;