-- Add new columns to booking_requests table for the multi-step booking flow
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS user_type text,
ADD COLUMN IF NOT EXISTS user_details text,
ADD COLUMN IF NOT EXISTS stay_duration integer,
ADD COLUMN IF NOT EXISTS booking_stage text DEFAULT 'initiated',
ADD COLUMN IF NOT EXISTS token_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS token_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS token_amount numeric DEFAULT 500;