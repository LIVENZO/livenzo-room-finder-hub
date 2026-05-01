-- 1. Add public_id column
ALTER TABLE public.owner_properties
ADD COLUMN IF NOT EXISTS public_id text UNIQUE;

-- 2. Backfill existing rows with unique public_ids
DO $$
DECLARE
  r RECORD;
  new_id TEXT;
  exists_check BOOLEAN;
BEGIN
  FOR r IN SELECT id FROM public.owner_properties WHERE public_id IS NULL LOOP
    LOOP
      new_id := public.generate_public_id();
      SELECT EXISTS(SELECT 1 FROM public.owner_properties WHERE public_id = new_id) INTO exists_check;
      IF NOT exists_check THEN EXIT; END IF;
    END LOOP;
    UPDATE public.owner_properties SET public_id = new_id WHERE id = r.id;
  END LOOP;
END $$;

-- 3. Trigger to auto-generate on insert
CREATE OR REPLACE FUNCTION public.auto_generate_property_public_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  exists_check BOOLEAN;
BEGIN
  IF NEW.public_id IS NULL THEN
    LOOP
      new_id := public.generate_public_id();
      SELECT EXISTS(SELECT 1 FROM public.owner_properties WHERE public_id = new_id) INTO exists_check;
      IF NOT exists_check THEN EXIT; END IF;
    END LOOP;
    NEW.public_id := new_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_generate_property_public_id ON public.owner_properties;
CREATE TRIGGER trg_auto_generate_property_public_id
BEFORE INSERT ON public.owner_properties
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_property_public_id();

-- 4. Search function for renters to find a property by its public_id
CREATE OR REPLACE FUNCTION public.search_property_by_public_id(search_public_id text)
RETURNS TABLE(
  property_id uuid,
  owner_id uuid,
  hostel_pg_name text,
  house_number text,
  property_location text,
  public_id text,
  avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    op.id AS property_id,
    op.owner_id,
    op.hostel_pg_name,
    op.house_number,
    op.property_location,
    op.public_id,
    up.avatar_url
  FROM public.owner_properties op
  LEFT JOIN public.user_profiles up ON up.id = op.owner_id
  WHERE op.is_active = true
    AND op.public_id IS NOT NULL
    AND (
      op.public_id = search_public_id
      OR (length(search_public_id) <= 10 AND op.public_id ILIKE search_public_id || '%')
    )
  LIMIT 1;
END;
$$;

-- 5. Updated add_owner_property that also accepts/returns context cleanly (already returns full row including new public_id)
-- The existing function returns SETOF owner_properties via RETURNING *, so it will now naturally include public_id.
-- No change needed there.