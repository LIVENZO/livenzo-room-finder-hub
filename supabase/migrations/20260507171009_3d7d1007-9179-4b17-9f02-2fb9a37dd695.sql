CREATE OR REPLACE FUNCTION public.save_property_location(
  p_property_id uuid,
  p_latitude numeric,
  p_longitude numeric
)
RETURNS public.owner_properties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row public.owner_properties;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_latitude < -90 OR p_latitude > 90 OR p_longitude < -180 OR p_longitude > 180 THEN
    RAISE EXCEPTION 'Invalid coordinates';
  END IF;

  UPDATE public.owner_properties
  SET location_latitude = p_latitude,
      location_longitude = p_longitude,
      updated_at = NOW()
  WHERE id = p_property_id
    AND owner_id = auth.uid()
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Property not found or not owned by you';
  END IF;

  IF v_row.is_primary THEN
    UPDATE public.user_profiles
    SET location_latitude = p_latitude,
        location_longitude = p_longitude,
        updated_at = NOW()
    WHERE id = auth.uid();
  END IF;

  RETURN v_row;
END;
$$;