-- Add UPI phone number field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN upi_phone_number text;