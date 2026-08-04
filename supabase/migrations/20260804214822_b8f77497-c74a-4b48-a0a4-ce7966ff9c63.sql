CREATE OR REPLACE FUNCTION public.get_top_room_images(p_limit integer DEFAULT 12)
RETURNS TABLE(room_id uuid, image_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.id, r.images[1]
  FROM public.top_rooms tr
  JOIN public.rooms r ON r.id = tr.room_id
  WHERE r.available = true
    AND r.images IS NOT NULL
    AND array_length(r.images, 1) > 0
    AND r.images[1] IS NOT NULL
    AND r.images[1] <> ''
  ORDER BY tr.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_room_images(integer) TO anon, authenticated, service_role;