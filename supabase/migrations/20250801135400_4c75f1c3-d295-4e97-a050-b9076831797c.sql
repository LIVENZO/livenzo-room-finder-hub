-- Create a function to clean up stale waiting sessions
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

-- Create a function to find or create anonymous chat
CREATE OR REPLACE FUNCTION public.find_or_create_anonymous_chat(user_id_param UUID)
RETURNS UUID
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