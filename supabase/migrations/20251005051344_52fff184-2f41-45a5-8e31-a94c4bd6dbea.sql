-- Add electric_bill_amount column to payments table to store the electric bill separately
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS electric_bill_amount numeric DEFAULT NULL;

COMMENT ON COLUMN public.payments.electric_bill_amount IS 'The electricity bill amount entered by the renter, separate from rent';