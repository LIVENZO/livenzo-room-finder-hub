-- Add billing_month column to payments table to track payment history by month
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS billing_month TEXT DEFAULT to_char(now(), 'YYYY-MM');

-- Update existing records to have proper billing_month based on payment_date
UPDATE public.payments 
SET billing_month = to_char(payment_date, 'YYYY-MM')
WHERE billing_month IS NULL OR billing_month = to_char(now(), 'YYYY-MM');

-- Add index for faster queries by billing_month
CREATE INDEX IF NOT EXISTS idx_payments_billing_month ON public.payments(billing_month);

-- Remove duplicate payments keeping only the most recent one per renter/owner/month
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY renter_id, owner_id, billing_month 
      ORDER BY created_at DESC, updated_at DESC
    ) as rn
  FROM public.payments
  WHERE relationship_id IS NOT NULL
)
DELETE FROM public.payments
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_monthly 
ON public.payments(renter_id, owner_id, billing_month) 
WHERE relationship_id IS NOT NULL;

-- Add comment explaining the billing_month format
COMMENT ON COLUMN public.payments.billing_month IS 'Format: YYYY-MM. Represents the billing period for this payment record.';
