-- 1️⃣ Remove any unique constraint on device_id or token
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN 
    SELECT conname 
    FROM pg_constraint
    WHERE conrelid = 'public.fcm_tokens'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.fcm_tokens DROP CONSTRAINT IF EXISTS %I;', cname);
  END LOOP;
END$$;

-- 2️⃣ Ensure all necessary columns exist
ALTER TABLE public.fcm_tokens
ADD COLUMN IF NOT EXISTS device_id text,
ADD COLUMN IF NOT EXISTS token text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3️⃣ Drop the old cleanup trigger that was deleting tokens
DROP TRIGGER IF EXISTS cleanup_device_tokens_trigger ON public.fcm_tokens;
DROP TRIGGER IF EXISTS cleanup_fcm_tokens_trigger ON public.fcm_tokens;

-- 4️⃣ Create index for faster lookups (not unique)
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_device_id ON public.fcm_tokens(device_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON public.fcm_tokens(token);

-- 5️⃣ Update the upsert function to allow multiple tokens per user/device
CREATE OR REPLACE FUNCTION public.upsert_fcm_token_safe(
  p_user_id uuid, 
  p_token text, 
  p_device_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Just insert the token, no deletions
  -- This allows multiple tokens per user and per device
  INSERT INTO public.fcm_tokens (user_id, token, device_id, created_at, updated_at)
  VALUES (p_user_id, p_token, p_device_id, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'FCM token saved successfully for user %', p_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error saving FCM token for user %: %', p_user_id, SQLERRM;
END;
$function$;