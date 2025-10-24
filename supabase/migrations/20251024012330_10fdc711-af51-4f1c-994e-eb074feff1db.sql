-- Drop the existing fcm_tokens table completely to start fresh
DROP TABLE IF EXISTS public.fcm_tokens CASCADE;

-- Recreate fcm_tokens table with correct structure
CREATE TABLE public.fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy - allow users to insert their own tokens
CREATE POLICY "Allow insert for logged in user"
ON public.fcm_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy - allow users to update their own tokens
CREATE POLICY "Allow update for logged in user"
ON public.fcm_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Create SELECT policy - allow users to view their own tokens
CREATE POLICY "Allow select for logged in user"
ON public.fcm_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Create DELETE policy - allow users to delete their own tokens
CREATE POLICY "Allow delete for logged in user"
ON public.fcm_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_device_id ON public.fcm_tokens(device_id);