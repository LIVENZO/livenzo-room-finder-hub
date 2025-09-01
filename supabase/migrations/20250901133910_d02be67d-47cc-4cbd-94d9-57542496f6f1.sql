-- Add razorpay_account_id column to user_profiles table for Razorpay Route
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS razorpay_account_id text;

-- Update data classification to include the new field as confidential
UPDATE public.user_profiles 
SET data_classification = jsonb_set(
  data_classification,
  '{confidential}',
  (data_classification->'confidential') || '["razorpay_account_id"]'::jsonb
)
WHERE data_classification IS NOT NULL;