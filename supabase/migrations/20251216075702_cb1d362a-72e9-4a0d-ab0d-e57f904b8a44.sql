-- Add videos column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.rooms.videos IS 'Array of video URLs for room video tours (max 2 videos, MP4 only)';