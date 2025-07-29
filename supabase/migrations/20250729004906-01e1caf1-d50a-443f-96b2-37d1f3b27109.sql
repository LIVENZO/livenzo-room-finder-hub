-- Add room_number field to user_profiles table for renters
ALTER TABLE public.user_profiles 
ADD COLUMN room_number text;