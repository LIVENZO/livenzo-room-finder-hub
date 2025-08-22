-- Fix remaining security issues from linter

-- 1. Fix functions that are missing proper search_path settings
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_google_role_conflict(google_id_param text, email_param text, requested_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_room_availability_for_owner(room_id uuid, is_available boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  UPDATE public.rooms
  SET available = is_available
  WHERE id = room_id AND owner_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_stale_waiting_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete waiting sessions older than 5 minutes
  DELETE FROM public.anonymous_chat_sessions 
  WHERE status = 'waiting' 
  AND created_at < NOW() - INTERVAL '5 minutes';
END;
$$;

CREATE OR REPLACE FUNCTION public.check_owner_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.is_owner_profile_complete = (
    NEW.full_name IS NOT NULL AND 
    NEW.phone IS NOT NULL AND
    NEW.accommodation_type IS NOT NULL AND
    NEW.property_name IS NOT NULL AND
    NEW.house_number IS NOT NULL AND
    NEW.total_rental_rooms IS NOT NULL AND
    NEW.resident_type IS NOT NULL AND
    NEW.property_location IS NOT NULL AND
    NEW.upi_phone_number IS NOT NULL AND
    NEW.razorpay_merchant_id IS NOT NULL
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_public_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.find_or_create_anonymous_chat(user_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_session_id UUID;
  new_session_id UUID;
BEGIN
  -- Clean up old waiting sessions first
  PERFORM public.cleanup_stale_waiting_sessions();
  
  -- Clean up any existing waiting sessions for this user
  DELETE FROM public.anonymous_chat_sessions 
  WHERE participant_1 = user_id_param 
  AND status = 'waiting';
  
  -- Try to find an existing waiting session from another user
  SELECT id INTO existing_session_id
  FROM public.anonymous_chat_sessions
  WHERE status = 'waiting' 
  AND participant_1 != user_id_param
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF existing_session_id IS NOT NULL THEN
    -- Join the existing session
    UPDATE public.anonymous_chat_sessions
    SET participant_2 = user_id_param,
        status = 'active'
    WHERE id = existing_session_id
    AND status = 'waiting'; -- Double check it's still waiting
    
    RETURN existing_session_id;
  ELSE
    -- Create a new waiting session
    INSERT INTO public.anonymous_chat_sessions (participant_1, status)
    VALUES (user_id_param, 'waiting')
    RETURNING id INTO new_session_id;
    
    RETURN new_session_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_unique_public_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_public_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.public_id IS NULL THEN
        NEW.public_id = ensure_unique_public_id();
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_google_account_role_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.archive_previous_connection_data(renter_user_id uuid, new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_active_renter_relationships(renter_user_id uuid)
RETURNS TABLE(id uuid, owner_id uuid, renter_id uuid, status text, chat_room_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, archived boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.owner_id, r.renter_id, r.status, r.chat_room_id, r.created_at, r.updated_at, r.archived
  FROM public.relationships r
  WHERE r.renter_id = renter_user_id 
    AND r.archived = FALSE
  ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  selected_role TEXT;
BEGIN
  selected_role := NEW.raw_user_meta_data ->> 'role';

  IF selected_role IS NULL THEN
    selected_role := 'renter';
  END IF;

  INSERT INTO public.user_role_assignments (user_id, email, role)
  VALUES (NEW.id, NEW.email, selected_role)
  ON CONFLICT (email, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_room_details_for_authenticated()
RETURNS TABLE(id uuid, title text, description text, images text[], price numeric, location text, facilities jsonb, owner_id uuid, owner_phone text, created_at timestamp with time zone, available boolean, location_latitude numeric, location_longitude numeric, house_no text, house_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.id, r.title, r.description, r.images, r.price, r.location, 
    r.facilities, r.owner_id, r.owner_phone, r.created_at, 
    COALESCE(r.available, true) as available,
    r.location_latitude, r.location_longitude, r.house_no, r.house_name
  FROM public.rooms r
  WHERE r.available = true;
$$;

CREATE OR REPLACE FUNCTION public.get_rooms_public()
RETURNS TABLE(id uuid, title text, description text, images text[], price numeric, location text, facilities jsonb, owner_id uuid, owner_phone text, created_at timestamp with time zone, available boolean, location_latitude numeric, location_longitude numeric, house_no text, house_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.id, r.title, r.description, r.images, r.price, r.location, 
    r.facilities, r.owner_id, 
    '***-***-' || RIGHT(r.owner_phone, 4) as owner_phone,
    r.created_at, 
    COALESCE(r.available, true) as available,
    r.location_latitude, r.location_longitude, r.house_no, r.house_name
  FROM public.rooms r
  WHERE r.available = true;
$$;