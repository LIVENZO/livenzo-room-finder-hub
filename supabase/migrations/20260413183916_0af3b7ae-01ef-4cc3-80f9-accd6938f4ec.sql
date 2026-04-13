ALTER TABLE public.rental_agreements
  ADD COLUMN IF NOT EXISTS security_deposit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maintenance_amount numeric DEFAULT 0;