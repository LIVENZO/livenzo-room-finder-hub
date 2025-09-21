-- Remove UNIQUE constraint on token column to allow token reuse after reinstalls
ALTER TABLE public.fcm_tokens DROP CONSTRAINT IF EXISTS fcm_tokens_token_key;

-- Add comment explaining the change
COMMENT ON COLUMN public.fcm_tokens.token IS 'FCM token - not unique to allow reuse after app reinstalls';