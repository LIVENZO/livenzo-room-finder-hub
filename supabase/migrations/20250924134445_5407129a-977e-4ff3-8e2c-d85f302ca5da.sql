-- Add deep_link_url column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN deep_link_url TEXT;