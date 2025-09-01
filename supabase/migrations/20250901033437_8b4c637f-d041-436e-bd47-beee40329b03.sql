-- Create rental_agreements table and policies
-- 1) Table
CREATE TABLE IF NOT EXISTS public.rental_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  renter_id uuid NOT NULL,
  monthly_rent numeric NOT NULL,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Uniqueness to support upsert semantics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rental_agreements_property_renter_unique'
  ) THEN
    ALTER TABLE public.rental_agreements
      ADD CONSTRAINT rental_agreements_property_renter_unique UNIQUE (property_id, renter_id);
  END IF;
END
$$;

-- 3) Enable RLS
ALTER TABLE public.rental_agreements ENABLE ROW LEVEL SECURITY;

-- 4) Policies (idempotent creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rental_agreements' AND policyname = 'allow_renter_select'
  ) THEN
    CREATE POLICY allow_renter_select ON public.rental_agreements
      FOR SELECT USING (renter_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rental_agreements' AND policyname = 'allow_owner_select'
  ) THEN
    CREATE POLICY allow_owner_select ON public.rental_agreements
      FOR SELECT USING (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rental_agreements' AND policyname = 'owners_can_insert_agreements'
  ) THEN
    CREATE POLICY owners_can_insert_agreements ON public.rental_agreements
      FOR INSERT
      WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rental_agreements' AND policyname = 'owners_can_update_agreements'
  ) THEN
    CREATE POLICY owners_can_update_agreements ON public.rental_agreements
      FOR UPDATE USING (owner_id = auth.uid());
  END IF;
END
$$;

-- 5) Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_rental_agreements_updated_at'
  ) THEN
    CREATE TRIGGER set_rental_agreements_updated_at
    BEFORE UPDATE ON public.rental_agreements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();
  END IF;
END
$$;
