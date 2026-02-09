
-- Table to store admin-curated top room IDs
CREATE TABLE public.top_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id)
);

-- Enable RLS
ALTER TABLE public.top_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can view top rooms"
  ON public.top_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Also allow public/anon read for unauthenticated feed
CREATE POLICY "Public can view top rooms"
  ON public.top_rooms FOR SELECT
  USING (true);

-- Only service_role can manage (admin)
CREATE POLICY "Service role can manage top rooms"
  ON public.top_rooms FOR ALL
  USING (auth.role() = 'service_role');
