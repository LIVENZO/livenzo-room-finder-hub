-- Fix rent amount and due date saving with proper unique constraints

-- 1. Add unique constraint on rental_agreements table
ALTER TABLE public.rental_agreements 
  DROP CONSTRAINT IF EXISTS unique_rental_agreement;

ALTER TABLE public.rental_agreements 
  ADD CONSTRAINT unique_rental_agreement 
  UNIQUE (owner_id, renter_id, property_id);

-- 2. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_rental_agreements_lookup 
  ON public.rental_agreements(owner_id, renter_id, property_id);

COMMENT ON CONSTRAINT unique_rental_agreement ON public.rental_agreements IS 
  'Ensures one rental agreement per owner-renter-property combination';