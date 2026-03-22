
CREATE TABLE public.offer_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  restarted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_overrides ENABLE ROW LEVEL SECURITY;

-- Users can read their own override
CREATE POLICY "Users can view their own offer override"
  ON public.offer_overrides FOR SELECT
  USING (user_id = auth.uid());

-- Only service_role can insert (admin action)
CREATE POLICY "Service role can manage offer overrides"
  ON public.offer_overrides FOR ALL
  USING (auth.role() = 'service_role');
