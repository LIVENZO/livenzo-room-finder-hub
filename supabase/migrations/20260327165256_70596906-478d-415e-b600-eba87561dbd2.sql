
-- Search logs table
CREATE TABLE public.search_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  search_query text NOT NULL DEFAULT '',
  selected_category text DEFAULT 'all',
  near_me_used boolean DEFAULT false,
  hotspot_used text,
  filters jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert search logs" ON public.search_logs
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Users can view own search logs" ON public.search_logs
  FOR SELECT TO public USING (user_id = auth.uid());

-- Property clicks table
CREATE TABLE public.property_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  property_id text NOT NULL,
  search_query text DEFAULT '',
  selected_category text DEFAULT 'all',
  source text DEFAULT 'search',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.property_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert property clicks" ON public.property_clicks
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Users can view own property clicks" ON public.property_clicks
  FOR SELECT TO public USING (user_id = auth.uid());

-- Indexes for analytics queries
CREATE INDEX idx_search_logs_user_id ON public.search_logs(user_id);
CREATE INDEX idx_search_logs_created_at ON public.search_logs(created_at DESC);
CREATE INDEX idx_search_logs_query ON public.search_logs(search_query);
CREATE INDEX idx_property_clicks_user_id ON public.property_clicks(user_id);
CREATE INDEX idx_property_clicks_property_id ON public.property_clicks(property_id);
CREATE INDEX idx_property_clicks_created_at ON public.property_clicks(created_at DESC);
