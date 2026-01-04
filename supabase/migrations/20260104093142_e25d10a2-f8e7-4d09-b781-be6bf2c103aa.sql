-- Add room_number column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN room_number text;