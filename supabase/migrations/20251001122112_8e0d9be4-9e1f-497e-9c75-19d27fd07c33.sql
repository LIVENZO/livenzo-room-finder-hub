-- Fix rent status update logic with proper unique constraints

-- 1. Create enum type for rent status if not exists
DO $$ BEGIN
  CREATE TYPE rent_payment_status AS ENUM ('pending', 'paid', 'unpaid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add unique constraint on payments table for monthly billing
-- First, drop the constraint if it exists to avoid errors
ALTER TABLE public.payments 
  DROP CONSTRAINT IF EXISTS unique_payment_per_month;

-- Add the unique constraint on (renter_id, owner_id, billing_month)
ALTER TABLE public.payments 
  ADD CONSTRAINT unique_payment_per_month 
  UNIQUE (renter_id, owner_id, billing_month);

-- 3. Add billing_month to rent_status if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.rent_status 
    ADD COLUMN IF NOT EXISTS billing_month TEXT DEFAULT to_char(now(), 'YYYY-MM');
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 4. Drop old unique constraint on rent_status if exists
ALTER TABLE public.rent_status 
  DROP CONSTRAINT IF EXISTS rent_status_relationship_id_key;

-- 5. Add new unique constraint on rent_status for monthly tracking
ALTER TABLE public.rent_status 
  DROP CONSTRAINT IF EXISTS unique_rent_status_per_month;

ALTER TABLE public.rent_status 
  ADD CONSTRAINT unique_rent_status_per_month 
  UNIQUE (relationship_id, billing_month);

-- 6. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_billing_month 
  ON public.payments(billing_month);

CREATE INDEX IF NOT EXISTS idx_rent_status_billing_month 
  ON public.rent_status(billing_month);

-- 7. Update existing records to have current billing_month if NULL
UPDATE public.payments 
SET billing_month = to_char(payment_date, 'YYYY-MM')
WHERE billing_month IS NULL AND payment_date IS NOT NULL;

UPDATE public.payments 
SET billing_month = to_char(now(), 'YYYY-MM')
WHERE billing_month IS NULL;

UPDATE public.rent_status 
SET billing_month = to_char(now(), 'YYYY-MM')
WHERE billing_month IS NULL;

COMMENT ON CONSTRAINT unique_payment_per_month ON public.payments IS 
  'Ensures one payment record per renter per owner per billing month';

COMMENT ON CONSTRAINT unique_rent_status_per_month ON public.rent_status IS 
  'Ensures one rent status record per relationship per billing month';