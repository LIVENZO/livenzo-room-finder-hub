-- Add UPI ID field to user profiles for UPI payment functionality
ALTER TABLE public.user_profiles ADD COLUMN upi_id text;