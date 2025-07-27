-- Fix all database functions by setting secure search paths to prevent SQL injection
-- This addresses the 11 warnings about mutable search paths

-- Update update_modified_column function
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update update_room_availability_for_owner function
CREATE OR REPLACE FUNCTION public.update_room_availability_for_owner(room_id uuid, is_available boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
BEGIN
  UPDATE public.rooms
  SET available = is_available
  WHERE id = room_id AND owner_id = auth.uid();
END;
$function$;

-- Update check_owner_profile_completion function
CREATE OR REPLACE FUNCTION public.check_owner_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.is_owner_profile_complete = (
    NEW.full_name IS NOT NULL AND 
    NEW.phone IS NOT NULL AND
    NEW.accommodation_type IS NOT NULL AND
    NEW.property_name IS NOT NULL AND
    NEW.house_number IS NOT NULL AND
    NEW.total_rental_rooms IS NOT NULL AND
    NEW.resident_type IS NOT NULL AND
    NEW.property_location IS NOT NULL
  );
  
  RETURN NEW;
END;
$function$;

-- Update generate_public_id function
CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
    random_char TEXT;
BEGIN
    FOR i IN 1..10 LOOP
        random_char := substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        result := result || random_char;
    END LOOP;
    
    RETURN result;
END;
$function$;

-- Update ensure_unique_public_id function
CREATE OR REPLACE FUNCTION public.ensure_unique_public_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        new_id := generate_public_id();
        
        SELECT EXISTS(
            SELECT 1 FROM public.user_profiles 
            WHERE public_id = new_id
        ) INTO id_exists;
        
        IF NOT id_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$function$;

-- Update auto_generate_public_id function
CREATE OR REPLACE FUNCTION public.auto_generate_public_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.public_id IS NULL THEN
        NEW.public_id = ensure_unique_public_id();
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Update check_google_account_role_conflict function
CREATE OR REPLACE FUNCTION public.check_google_account_role_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  existing_role TEXT;
  existing_google_id TEXT;
BEGIN
  SELECT role, google_id INTO existing_role, existing_google_id
  FROM public.user_role_assignments 
  WHERE google_id = NEW.google_id AND role != NEW.role
  LIMIT 1;
  
  IF existing_role IS NOT NULL THEN
    RAISE EXCEPTION 'This Google account is already registered as a %. Please use a different Google account for % role.', existing_role, NEW.role;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update archive_previous_connection_data function
CREATE OR REPLACE FUNCTION public.archive_previous_connection_data(renter_user_id uuid, new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.relationships 
  SET archived = TRUE, updated_at = NOW()
  WHERE renter_id = renter_user_id 
    AND owner_id != new_owner_id 
    AND status = 'accepted'
    AND archived = FALSE;

  UPDATE public.documents 
  SET archived = TRUE, updated_at = NOW()
  WHERE relationship_id IN (
    SELECT id FROM public.relationships 
    WHERE renter_id = renter_user_id 
      AND owner_id != new_owner_id 
      AND archived = TRUE
  ) AND archived = FALSE;

  UPDATE public.notices 
  SET archived = TRUE
  WHERE renter_id = renter_user_id 
    AND owner_id != new_owner_id 
    AND archived = FALSE;
END;
$function$;

-- Update get_active_renter_relationships function
CREATE OR REPLACE FUNCTION public.get_active_renter_relationships(renter_user_id uuid)
RETURNS TABLE(id uuid, owner_id uuid, renter_id uuid, status text, chat_room_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, archived boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.id, r.owner_id, r.renter_id, r.status, r.chat_room_id, r.created_at, r.updated_at, r.archived
  FROM public.relationships r
  WHERE r.renter_id = renter_user_id 
    AND r.archived = FALSE
  ORDER BY r.created_at DESC;
END;
$function$;

-- Update handle_user_role_assignment function
CREATE OR REPLACE FUNCTION public.handle_user_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  selected_role TEXT;
  google_sub TEXT;
BEGIN
  google_sub := NEW.raw_user_meta_data ->> 'sub';
  selected_role := NEW.raw_user_meta_data ->> 'role';
  
  IF selected_role IS NULL THEN
    selected_role := 'renter';
  END IF;
  
  INSERT INTO public.user_role_assignments (user_id, email, role, google_id)
  VALUES (NEW.id, NEW.email, selected_role, google_sub)
  ON CONFLICT (email, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Update get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_role_assignments
  WHERE user_id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'renter');
END;
$function$;

-- Add additional security validation functions
CREATE OR REPLACE FUNCTION public.validate_relationship_access(relationship_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.relationships 
    WHERE id = relationship_uuid 
    AND (owner_id = user_uuid OR renter_id = user_uuid)
  );
END;
$function$;

-- Add input validation function for sensitive operations
CREATE OR REPLACE FUNCTION public.validate_sensitive_operation(operation_type text, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  last_operation_time timestamp with time zone;
  rate_limit_minutes integer := 5;
BEGIN
  -- Check if user exists and is active
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Simple rate limiting for sensitive operations
  SELECT MAX(created_at) INTO last_operation_time
  FROM public.relationships
  WHERE (owner_id = user_uuid OR renter_id = user_uuid)
  AND created_at > NOW() - INTERVAL '1 minute' * rate_limit_minutes;
  
  IF last_operation_time IS NOT NULL AND operation_type = 'create_relationship' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;