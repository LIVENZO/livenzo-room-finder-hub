
-- This file is for reference only, not for direct execution

-- Create function to get all rooms
CREATE OR REPLACE FUNCTION public.get_rooms()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  images text[],
  price integer,
  location text,
  facilities jsonb,
  owner_id uuid,
  owner_phone text,
  created_at timestamptz,
  available boolean
) LANGUAGE sql AS $$
  SELECT id, title, description, images, price, location, facilities, 
         owner_id, owner_phone, created_at, 
         COALESCE(available, true) as available
  FROM public.rooms;
$$;

-- Create function to insert a room
CREATE OR REPLACE FUNCTION public.insert_room(room_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_room jsonb;
BEGIN
  INSERT INTO public.rooms (
    title, description, images, price, location, facilities, 
    owner_id, owner_phone, available
  ) VALUES (
    room_data->>'title',
    room_data->>'description',
    (room_data->'images')::text[]::text[],
    (room_data->>'price')::integer,
    room_data->>'location',
    room_data->'facilities',
    (room_data->>'owner_id')::uuid,
    room_data->>'owner_phone',
    COALESCE((room_data->>'available')::boolean, true)
  )
  RETURNING row_to_json(rooms.*)::jsonb INTO new_room;
  
  RETURN new_room;
END;
$$;

-- Create function to update room availability
CREATE OR REPLACE FUNCTION public.update_room_availability(room_id uuid, is_available boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.rooms
  SET available = is_available
  WHERE id = room_id AND owner_id = auth.uid();
END;
$$;
