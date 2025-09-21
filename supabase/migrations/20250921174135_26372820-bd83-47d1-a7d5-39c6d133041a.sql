-- Improve FCM tokens table structure for better conflict handling
-- Drop the unique token constraint since tokens can be reused across reinstalls
DROP INDEX IF EXISTS public.unique_fcm_token;

-- Create a function to safely upsert FCM tokens
CREATE OR REPLACE FUNCTION public.upsert_fcm_token_safe(p_user_id uuid, p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First, delete any existing tokens for this user to ensure only one token per user
  DELETE FROM public.fcm_tokens WHERE user_id = p_user_id;
  
  -- Then, delete any other users who might have this same token (for reinstall scenarios)
  DELETE FROM public.fcm_tokens WHERE token = p_token;
  
  -- Finally, insert the new token
  INSERT INTO public.fcm_tokens (user_id, token, created_at)
  VALUES (p_user_id, p_token, NOW());
  
  -- Log the operation for debugging
  RAISE NOTICE 'FCM token upserted successfully for user %', p_user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RAISE WARNING 'Error upserting FCM token for user %: %', p_user_id, SQLERRM;
END;
$$;

-- Add a cleanup function to remove stale tokens (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_stale_fcm_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.fcm_tokens 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Stale FCM tokens cleaned up';
END;
$$;