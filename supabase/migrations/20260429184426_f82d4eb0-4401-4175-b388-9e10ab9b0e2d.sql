
-- Create owner_properties table
CREATE TABLE IF NOT EXISTS public.owner_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  hostel_pg_name TEXT NOT NULL,
  accommodation_type TEXT,
  house_number TEXT,
  property_name TEXT,
  property_location TEXT,
  total_rental_rooms INTEGER,
  resident_type TEXT,
  location_latitude NUMERIC,
  location_longitude NUMERIC,
  upi_id TEXT,
  upi_phone_number TEXT,
  razorpay_merchant_id TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_properties_owner ON public.owner_properties(owner_id);

ALTER TABLE public.owner_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage own properties select" ON public.owner_properties;
CREATE POLICY "Owners manage own properties select"
  ON public.owner_properties FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own properties insert" ON public.owner_properties;
CREATE POLICY "Owners manage own properties insert"
  ON public.owner_properties FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own properties update" ON public.owner_properties;
CREATE POLICY "Owners manage own properties update"
  ON public.owner_properties FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage own properties delete" ON public.owner_properties;
CREATE POLICY "Owners manage own properties delete"
  ON public.owner_properties FOR DELETE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Renters view connected owner properties" ON public.owner_properties;
CREATE POLICY "Renters view connected owner properties"
  ON public.owner_properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.relationships r
      WHERE r.owner_id = owner_properties.owner_id
        AND r.renter_id = auth.uid()
        AND r.status = 'accepted'
        AND COALESCE(r.archived, false) = false
    )
  );

DROP TRIGGER IF EXISTS trg_owner_properties_updated_at ON public.owner_properties;
CREATE TRIGGER trg_owner_properties_updated_at
  BEFORE UPDATE ON public.owner_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

-- Add scoping columns
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.relationships ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS owner_property_id UUID;

CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON public.rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_relationships_property_id ON public.relationships(property_id);
CREATE INDEX IF NOT EXISTS idx_notices_property_id ON public.notices(property_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_property_id ON public.booking_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_property_id ON public.rental_agreements(owner_property_id);

-- Auto-migrate existing owner profile data
INSERT INTO public.owner_properties (
  owner_id, hostel_pg_name, accommodation_type, house_number, property_name,
  property_location, total_rental_rooms, resident_type,
  location_latitude, location_longitude,
  upi_id, upi_phone_number, razorpay_merchant_id, is_primary, is_active
)
SELECT
  up.id,
  COALESCE(up.hostel_pg_name, up.property_name, 'My Property'),
  up.accommodation_type,
  up.house_number,
  up.property_name,
  up.property_location,
  up.total_rental_rooms,
  up.resident_type,
  up.location_latitude,
  up.location_longitude,
  up.upi_id,
  up.upi_phone_number,
  up.razorpay_merchant_id,
  true,
  true
FROM public.user_profiles up
WHERE (up.hostel_pg_name IS NOT NULL OR up.property_name IS NOT NULL OR up.house_number IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.owner_properties op WHERE op.owner_id = up.id
  );

-- Backfill rooms.property_id
UPDATE public.rooms r
SET property_id = op.id
FROM public.owner_properties op
WHERE r.property_id IS NULL
  AND op.owner_id = r.owner_id
  AND op.is_primary = true;

UPDATE public.relationships rel
SET property_id = op.id
FROM public.owner_properties op
WHERE rel.property_id IS NULL
  AND op.owner_id = rel.owner_id
  AND op.is_primary = true;

UPDATE public.notices n
SET property_id = op.id
FROM public.owner_properties op
WHERE n.property_id IS NULL
  AND op.owner_id = n.owner_id
  AND op.is_primary = true;

UPDATE public.booking_requests br
SET property_id = op.id
FROM public.owner_properties op, public.rooms rm
WHERE br.property_id IS NULL
  AND rm.id = br.room_id
  AND op.owner_id = rm.owner_id
  AND op.is_primary = true;

-- Disable rent_status sync trigger during backfill to avoid duplicate-key conflict
ALTER TABLE public.rental_agreements DISABLE TRIGGER USER;

UPDATE public.rental_agreements ra
SET owner_property_id = op.id
FROM public.owner_properties op
WHERE ra.owner_property_id IS NULL
  AND op.owner_id = ra.owner_id
  AND op.is_primary = true;

ALTER TABLE public.rental_agreements ENABLE TRIGGER USER;

-- Helper RPCs
CREATE OR REPLACE FUNCTION public.get_my_owner_properties()
RETURNS SETOF public.owner_properties
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.owner_properties
  WHERE owner_id = auth.uid() AND is_active = true
  ORDER BY is_primary DESC, created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.add_owner_property(
  p_hostel_pg_name TEXT,
  p_accommodation_type TEXT DEFAULT NULL,
  p_house_number TEXT DEFAULT NULL,
  p_property_name TEXT DEFAULT NULL,
  p_property_location TEXT DEFAULT NULL,
  p_total_rental_rooms INTEGER DEFAULT NULL,
  p_resident_type TEXT DEFAULT NULL,
  p_location_latitude NUMERIC DEFAULT NULL,
  p_location_longitude NUMERIC DEFAULT NULL,
  p_upi_id TEXT DEFAULT NULL,
  p_upi_phone_number TEXT DEFAULT NULL,
  p_razorpay_merchant_id TEXT DEFAULT NULL
)
RETURNS public.owner_properties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_primary BOOLEAN;
  v_row public.owner_properties;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.owner_properties WHERE owner_id = auth.uid() AND is_primary = true)
    INTO v_has_primary;

  INSERT INTO public.owner_properties (
    owner_id, hostel_pg_name, accommodation_type, house_number, property_name,
    property_location, total_rental_rooms, resident_type,
    location_latitude, location_longitude,
    upi_id, upi_phone_number, razorpay_merchant_id,
    is_primary, is_active
  ) VALUES (
    auth.uid(), p_hostel_pg_name, p_accommodation_type, p_house_number, p_property_name,
    p_property_location, p_total_rental_rooms, p_resident_type,
    p_location_latitude, p_location_longitude,
    p_upi_id, p_upi_phone_number, p_razorpay_merchant_id,
    NOT v_has_primary, true
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
