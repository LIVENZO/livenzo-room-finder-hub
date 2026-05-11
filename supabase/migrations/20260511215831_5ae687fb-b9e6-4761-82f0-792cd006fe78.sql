
-- Allow accepted collaborators to SELECT the shared property row
CREATE POLICY "Accepted collaborators view shared properties"
ON public.owner_properties
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_collaborators pc
    WHERE pc.property_id = owner_properties.id
      AND pc.collaborator_id = auth.uid()
      AND pc.status = 'accepted'
  )
);

-- Replace get_my_owner_properties to include shared properties + role
DROP FUNCTION IF EXISTS public.get_my_owner_properties();

CREATE OR REPLACE FUNCTION public.get_my_owner_properties()
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  hostel_pg_name text,
  accommodation_type text,
  house_number text,
  property_name text,
  property_location text,
  total_rental_rooms integer,
  resident_type text,
  location_latitude numeric,
  location_longitude numeric,
  upi_id text,
  upi_phone_number text,
  razorpay_merchant_id text,
  is_primary boolean,
  is_active boolean,
  public_id text,
  created_at timestamptz,
  updated_at timestamptz,
  my_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    op.id, op.owner_id, op.hostel_pg_name, op.accommodation_type, op.house_number,
    op.property_name, op.property_location, op.total_rental_rooms, op.resident_type,
    op.location_latitude, op.location_longitude, op.upi_id, op.upi_phone_number,
    op.razorpay_merchant_id, op.is_primary, op.is_active, op.public_id,
    op.created_at, op.updated_at,
    'owner'::text AS my_role
  FROM public.owner_properties op
  WHERE op.owner_id = auth.uid() AND op.is_active = true

  UNION ALL

  SELECT
    op.id, op.owner_id, op.hostel_pg_name, op.accommodation_type, op.house_number,
    op.property_name, op.property_location, op.total_rental_rooms, op.resident_type,
    op.location_latitude, op.location_longitude, op.upi_id, op.upi_phone_number,
    op.razorpay_merchant_id,
    false AS is_primary,
    op.is_active, op.public_id,
    op.created_at, op.updated_at,
    pc.role::text AS my_role
  FROM public.property_collaborators pc
  JOIN public.owner_properties op ON op.id = pc.property_id
  WHERE pc.collaborator_id = auth.uid()
    AND pc.status = 'accepted'
    AND op.is_active = true
    AND op.owner_id <> auth.uid()
  ORDER BY 15 DESC, 18 ASC;
$$;
