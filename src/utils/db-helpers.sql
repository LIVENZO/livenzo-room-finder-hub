
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
  -- Use the dedicated function we created for owners
  PERFORM public.update_room_availability_for_owner(room_id, is_available);
END;
$$;

-- Create function to initiate a relationship between owner and renter
CREATE OR REPLACE FUNCTION public.create_owner_renter_relationship(owner_uuid uuid, renter_uuid uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_relationship_id uuid;
BEGIN
  INSERT INTO public.relationships (owner_id, renter_id)
  VALUES (owner_uuid, renter_uuid)
  RETURNING id INTO new_relationship_id;
  
  RETURN new_relationship_id;
END;
$$;

-- Create function to update relationship status
CREATE OR REPLACE FUNCTION public.update_relationship_status(relationship_uuid uuid, new_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.relationships
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = relationship_uuid
    AND (
      (auth.uid() = owner_id)
      OR 
      (auth.uid() = renter_id AND status = 'pending' AND new_status IN ('accepted', 'declined'))
    );
  
  RETURN FOUND;
END;
$$;

