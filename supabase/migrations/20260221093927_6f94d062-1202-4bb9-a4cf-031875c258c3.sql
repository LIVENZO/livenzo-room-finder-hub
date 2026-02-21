
-- Create hotspots table for landmark/hotspot search
CREATE TABLE public.hotspots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  city text DEFAULT 'Kota',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index on name for fast lookups
CREATE INDEX idx_hotspots_name ON public.hotspots USING gin (to_tsvector('english', name));
CREATE INDEX idx_hotspots_name_lower ON public.hotspots (lower(name));

-- Enable RLS
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;

-- Public read access (hotspots are public reference data)
CREATE POLICY "Anyone can view hotspots" ON public.hotspots FOR SELECT USING (true);

-- Only service role can manage hotspots
CREATE POLICY "Service role can manage hotspots" ON public.hotspots FOR ALL USING (auth.role() = 'service_role');

-- Insert initial hotspot data
INSERT INTO public.hotspots (name, latitude, longitude) VALUES
  ('Allen Samarth', 25.1800, 75.8648),
  ('Allen Sakar', 25.1785, 75.8580),
  ('Motion Kota', 25.1750, 75.8560),
  ('City Mall Kota', 25.1820, 75.8500),
  ('Talwandi', 25.1760, 75.8450),
  ('Rajeev Gandhi Nagar', 25.1700, 75.8400),
  ('Vibhav Nagar', 25.1850, 75.8550),
  ('Mahaveer Nagar', 25.1680, 75.8520),
  ('Kunhari', 25.1600, 75.8350),
  ('Dadabari', 25.1900, 75.8600),
  ('Gumanpura', 25.1830, 75.8650),
  ('Borkhera', 25.1720, 75.8700),
  ('Nayapura', 25.1780, 75.8480),
  ('Jawahar Nagar', 25.1650, 75.8550),
  ('Vigyan Nagar', 25.1550, 75.8400);
