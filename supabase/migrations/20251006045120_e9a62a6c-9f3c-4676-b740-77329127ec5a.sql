-- 1. Make upi_id nullable in owner_upi_details table
ALTER TABLE public.owner_upi_details 
ALTER COLUMN upi_id DROP NOT NULL;

-- 2. Add updated_at column to rooms table with default value
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create or replace the update_room_availability_for_owner function
-- to only update the available column (updated_at will be handled by trigger if needed)
CREATE OR REPLACE FUNCTION public.update_room_availability_for_owner(room_id uuid, is_available boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Check if the user is the owner of the room
  IF NOT EXISTS (
    SELECT 1 FROM rooms 
    WHERE id = room_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only update availability for your own rooms';
  END IF;
  
  -- Update only the room availability
  UPDATE rooms 
  SET available = is_available
  WHERE id = room_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
END;
$$;