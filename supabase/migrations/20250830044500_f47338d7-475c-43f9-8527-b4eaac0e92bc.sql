-- First, let's check if payments table exists and update it to match requirements
-- Update payments table to include the required columns for the dual payment system
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS rent_id UUID REFERENCES rent_status(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_rent_id ON payments(rent_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);

-- Update payment status enum to be more specific
ALTER TABLE payments 
ALTER COLUMN payment_status SET DEFAULT 'pending';

-- Ensure we have all the necessary columns for Razorpay integration
-- razorpay_payment_id and razorpay_order_id should already exist based on existing code