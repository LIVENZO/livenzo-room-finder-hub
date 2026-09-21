GRANT SELECT (
  id,
  title,
  description,
  images,
  videos,
  price,
  location,
  facilities,
  owner_id,
  created_at,
  updated_at,
  available,
  location_latitude,
  location_longitude,
  house_no,
  house_name,
  maximum_price,
  minimum_price,
  property_type,
  pg_rent,
  hostel_rent,
  is_top_room
) ON public.rooms TO anon, authenticated;

GRANT ALL ON public.rooms TO service_role;