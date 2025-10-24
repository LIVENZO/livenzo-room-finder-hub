-- Add indexes for fcm_tokens table for faster lookups
-- Only create if they don't already exist

-- Index on device_id for fast unique lookups during upsert
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_device_id ON public.fcm_tokens(device_id);

-- Index on user_id for fast user token lookups
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);

-- Index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_created_at ON public.fcm_tokens(created_at);

COMMENT ON INDEX idx_fcm_tokens_device_id IS 'Fast lookup by device_id for upsert operations';
COMMENT ON INDEX idx_fcm_tokens_user_id IS 'Fast lookup of all tokens for a user';
COMMENT ON INDEX idx_fcm_tokens_created_at IS 'Support for cleanup of stale tokens';