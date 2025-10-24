-- 1️⃣ Ensure fcm_tokens table has the exact columns required
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2️⃣ Enable RLS on fcm_tokens
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- 3️⃣ Drop all existing RLS policies on fcm_tokens
DROP POLICY IF EXISTS "Allow insert for logged in user" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Allow select for logged in user" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Allow update for logged in user" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Allow delete for logged in user" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can select their own tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.fcm_tokens;

-- 4️⃣ Create new RLS policies
CREATE POLICY "Users can insert their own tokens"
ON public.fcm_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own tokens"
ON public.fcm_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON public.fcm_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
ON public.fcm_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5️⃣ Drop old triggers and functions
DROP TRIGGER IF EXISTS cleanup_fcm_tokens_trigger ON public.fcm_tokens;
DROP TRIGGER IF EXISTS cleanup_old_device_tokens_trigger ON public.fcm_tokens;
DROP FUNCTION IF EXISTS public.cleanup_fcm_tokens() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_device_tokens() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_stale_fcm_tokens() CASCADE;
DROP FUNCTION IF EXISTS public.upsert_fcm_token(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.upsert_fcm_token_safe(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.upsert_fcm_token_safe(uuid, text, text) CASCADE;

-- 6️⃣ Create the new save_fcm_token function
CREATE OR REPLACE FUNCTION public.save_fcm_token(
  p_token text,
  p_device_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.fcm_tokens (user_id, token, device_id, created_at, updated_at)
  VALUES (auth.uid(), p_token, p_device_id, now(), now())
  ON CONFLICT DO NOTHING;
END;
$$;

-- 7️⃣ Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.save_fcm_token(text, text) TO authenticated;