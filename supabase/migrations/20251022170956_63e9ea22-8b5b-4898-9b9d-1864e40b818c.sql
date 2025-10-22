-- Fix fcm_tokens table to support multiple devices per user

-- Step 1: Drop any existing UNIQUE constraint on device_id if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fcm_tokens_device_id_key'
    ) THEN
        ALTER TABLE public.fcm_tokens DROP CONSTRAINT fcm_tokens_device_id_key;
    END IF;
END $$;

-- Step 2: Ensure token column has a unique constraint (one token per device globally)
-- Drop existing constraint if it exists with different name
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fcm_tokens_token_key' AND conrelid = 'public.fcm_tokens'::regclass
    ) THEN
        ALTER TABLE public.fcm_tokens ADD CONSTRAINT fcm_tokens_token_key UNIQUE (token);
    END IF;
END $$;

-- Step 3: Update the upsert function to handle multiple devices per user
CREATE OR REPLACE FUNCTION public.upsert_fcm_token_safe(p_user_id uuid, p_token text, p_device_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Delete any existing row with this exact token (handles device reinstalls)
  DELETE FROM public.fcm_tokens WHERE token = p_token;
  
  -- Insert the new token for this user and device
  INSERT INTO public.fcm_tokens (user_id, token, device_id, created_at)
  VALUES (p_user_id, p_token, p_device_id, NOW());
  
  -- Log success
  RAISE NOTICE 'FCM token upserted successfully for user % on device %', p_user_id, COALESCE(p_device_id, 'unknown');
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RAISE WARNING 'Error upserting FCM token for user %: %', p_user_id, SQLERRM;
END;
$function$;

-- Step 4: Remove the old cleanup trigger that limited one token per user
DROP TRIGGER IF EXISTS cleanup_fcm_tokens_on_insert ON public.fcm_tokens;

-- Step 5: Create a new trigger to clean up old tokens for the same device (optional, keeps table clean)
CREATE OR REPLACE FUNCTION public.cleanup_old_device_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only delete old tokens for the same user AND device_id combination
  -- This allows multiple devices per user while cleaning up old tokens from same device
  IF NEW.device_id IS NOT NULL THEN
    DELETE FROM public.fcm_tokens 
    WHERE user_id = NEW.user_id 
      AND device_id = NEW.device_id
      AND token != NEW.token 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for device-specific cleanup
DROP TRIGGER IF EXISTS cleanup_old_device_tokens_trigger ON public.fcm_tokens;
CREATE TRIGGER cleanup_old_device_tokens_trigger
AFTER INSERT ON public.fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_device_tokens();

-- Verification queries (run these after migration to test):
-- 1. Check table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'fcm_tokens' AND table_schema = 'public';

-- 2. Check constraints
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid = 'public.fcm_tokens'::regclass;

-- 3. Test insert (replace with actual values)
-- SELECT public.upsert_fcm_token_safe(
--   '00000000-0000-0000-0000-000000000001'::uuid, 
--   'test_token_device1', 
--   'device_001'
-- );
-- SELECT public.upsert_fcm_token_safe(
--   '00000000-0000-0000-0000-000000000001'::uuid, 
--   'test_token_device2', 
--   'device_002'
-- );

-- 4. Verify multiple devices per user
-- SELECT user_id, device_id, token, created_at 
-- FROM public.fcm_tokens 
-- WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;