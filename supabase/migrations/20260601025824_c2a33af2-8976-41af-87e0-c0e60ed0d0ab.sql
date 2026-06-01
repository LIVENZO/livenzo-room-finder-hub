
CREATE TABLE public.electricity_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relationship_id UUID NOT NULL,
  renter_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  cycle_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_electricity_bills_relationship ON public.electricity_bills(relationship_id, cycle_start_date DESC);
CREATE INDEX idx_electricity_bills_renter ON public.electricity_bills(renter_id, cycle_start_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.electricity_bills TO authenticated;
GRANT ALL ON public.electricity_bills TO service_role;

ALTER TABLE public.electricity_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage electricity bills"
  ON public.electricity_bills FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Renters view their electricity bills"
  ON public.electricity_bills FOR SELECT TO authenticated
  USING (renter_id = auth.uid());

CREATE POLICY "Collaborators view electricity bills"
  ON public.electricity_bills FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = electricity_bills.relationship_id
      AND r.property_id IS NOT NULL
      AND public.has_property_access(r.property_id, auth.uid())
  ));

CREATE POLICY "Managers add electricity bills"
  ON public.electricity_bills FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = electricity_bills.relationship_id
      AND r.property_id IS NOT NULL
      AND public.has_property_edit_access(r.property_id, auth.uid())
  ));

CREATE POLICY "Managers update electricity bills"
  ON public.electricity_bills FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = electricity_bills.relationship_id
      AND r.property_id IS NOT NULL
      AND public.has_property_edit_access(r.property_id, auth.uid())
  ));

CREATE OR REPLACE FUNCTION public.set_electricity_bill_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_electricity_bills_updated_at
BEFORE UPDATE ON public.electricity_bills
FOR EACH ROW
EXECUTE FUNCTION public.set_electricity_bill_updated_at();
