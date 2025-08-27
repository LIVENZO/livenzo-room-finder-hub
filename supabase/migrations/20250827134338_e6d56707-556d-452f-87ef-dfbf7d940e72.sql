-- Fix search path security issue for the room availability function
CREATE OR REPLACE FUNCTION update_room_availability_for_owner(
  room_id uuid,
  is_available boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is the owner of the room
  IF NOT EXISTS (
    SELECT 1 FROM rooms 
    WHERE id = room_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only update availability for your own rooms';
  END IF;
  
  -- Update the room availability
  UPDATE rooms 
  SET available = is_available, 
      updated_at = now()
  WHERE id = room_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
END;
$$;