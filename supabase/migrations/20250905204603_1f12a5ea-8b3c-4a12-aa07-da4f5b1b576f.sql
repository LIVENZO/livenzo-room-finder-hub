-- Create a secure function that only returns safe public fields for public_id searches
-- This ensures sensitive data cannot be accessed even if the application tries to select more fields

CREATE OR REPLACE FUNCTION public.search_user_by_public_id(search_public_id text)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  public_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users to search
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Return only safe public fields
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
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
$$;