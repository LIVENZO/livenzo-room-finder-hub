-- Add booking column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS booking boolean DEFAULT false;