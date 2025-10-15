-- Update the search_user_by_public_id function to return hostel_pg_name for owners
DROP FUNCTION IF EXISTS public.search_user_by_public_id(text);

CREATE OR REPLACE FUNCTION public.search_user_by_public_id(search_public_id text)
RETURNS TABLE(id uuid, full_name text, avatar_url text, public_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow authenticated users to search
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Return only safe public fields, preferring hostel_pg_name for owners
  RETURN QUERY
  SELECT 
    up.id,
    COALESCE(up.hostel_pg_name, up.full_name) as full_name,
    up.avatar_url,
    up.public_id
  FROM public.user_profiles up
  WHERE up.public_id IS NOT NULL
    AND (
      up.public_id = search_public_id 
      OR (length(search_public_id) <= 10 AND up.public_id ILIKE search_public_id || '%')
    )
  LIMIT 1;
END;
$function$;