
-- Add is_top_room column to rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_top_room boolean NOT NULL DEFAULT false;

-- Sync existing top_rooms entries
UPDATE public.rooms SET is_top_room = true WHERE id IN (SELECT room_id FROM public.top_rooms);

-- Create function to toggle top room status (max 20, auto-evict oldest)
CREATE OR REPLACE FUNCTION public.toggle_top_room(p_room_id uuid, p_is_top boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Verify caller owns the room
  IF NOT EXISTS (SELECT 1 FROM rooms WHERE id = p_room_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'You can only manage your own rooms';
  END IF;

  IF p_is_top THEN
    -- Insert if not already present
    INSERT INTO top_rooms (room_id) VALUES (p_room_id) ON CONFLICT (room_id) DO NOTHING;

    -- Enforce max 20: remove oldest entries beyond limit
    SELECT count(*) INTO v_count FROM top_rooms;
    IF v_count > 20 THEN
      DELETE FROM top_rooms WHERE id IN (
        SELECT id FROM top_rooms ORDER BY created_at ASC LIMIT (v_count - 20)
      );
      -- Update is_top_room for evicted rooms
      UPDATE rooms SET is_top_room = false
      WHERE is_top_room = true AND id NOT IN (SELECT room_id FROM top_rooms);
    END IF;
  ELSE
    DELETE FROM top_rooms WHERE room_id = p_room_id;
  END IF;

  -- Update the rooms column
  UPDATE rooms SET is_top_room = p_is_top WHERE id = p_room_id;
END;
$$;
