-- Fix the create_owner_notice function to return boolean instead of notices type
CREATE OR REPLACE FUNCTION public.create_owner_notice(p_renter_id uuid, p_message text, p_title text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Must have accepted, non-archived relationship
  IF NOT EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.owner_id = auth.uid()
      AND r.renter_id = p_renter_id
      AND r.status = 'accepted'
      AND COALESCE(r.archived, false) = false
  ) THEN
    RAISE EXCEPTION 'No accepted relationship with this renter';
  END IF;

  INSERT INTO public.notices(owner_id, renter_id, message, title)
  VALUES (auth.uid(), p_renter_id, p_message, p_title);

  RETURN true;
END; $function$