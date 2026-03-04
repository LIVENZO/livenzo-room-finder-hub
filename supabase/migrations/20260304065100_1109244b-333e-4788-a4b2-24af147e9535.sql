
-- Add media_processing flag to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS media_processing boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.rooms.media_processing IS 'True while background media compression is in progress';
