-- Fix FCM token conflicts with proper UPSERT logic and triggers
-- Handle existing dependencies properly

-- Step 1: Drop existing trigger and function with CASCADE
DROP TRIGGER IF EXISTS trg_replace_fcm_token ON public.fcm_tokens;
DROP FUNCTION IF EXISTS public.replace_fcm_token() CASCADE;

-- Step 2: Create a function to handle FCM token upserts with proper conflict resolution
CREATE OR REPLACE FUNCTION public.upsert_fcm_token(p_user_id uuid, p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First, delete any existing tokens for this user (ensure only one token per user)
  DELETE FROM public.fcm_tokens WHERE user_id = p_user_id;
  
  -- Then, upsert the token (handles duplicate tokens from reinstalls)
  INSERT INTO public.fcm_tokens (user_id, token, created_at)
  VALUES (p_user_id, p_token, NOW())
  ON CONFLICT (token) 
  DO UPDATE SET 
    user_id = EXCLUDED.user_id,
    created_at = EXCLUDED.created_at;
END;
$$;

-- Step 3: Create a new trigger function for automatic token cleanup
CREATE OR REPLACE FUNCTION public.cleanup_fcm_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new token is inserted, delete any old tokens for the same user
  -- This ensures one token per user
  DELETE FROM public.fcm_tokens 
  WHERE user_id = NEW.user_id 
    AND token != NEW.token 
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$;

-- Step 4: Create trigger to automatically cleanup old tokens
CREATE TRIGGER cleanup_fcm_tokens_trigger
  AFTER INSERT ON public.fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_fcm_tokens();

-- Step 5: Add a unique constraint on token to prevent duplicates
-- First drop existing constraint if it exists
ALTER TABLE public.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_token_key;
ALTER TABLE public.fcm_tokens ADD CONSTRAINT fcm_tokens_token_unique UNIQUE (token);

-- Step 6: Create an index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens (user_id);

-- Step 7: Update RLS policies to ensure proper access control
DROP POLICY IF EXISTS "Users can manage their FCM token" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can update their own FCM tokens" ON public.fcm_tokens;

-- Create comprehensive RLS policy for FCM token management
CREATE POLICY "Users can manage their own FCM tokens" ON public.fcm_tokens
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);