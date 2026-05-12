
-- Helper: does the user have access (owner or accepted collaborator) to a property?
CREATE OR REPLACE FUNCTION public.has_property_access(_property_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = _property_id AND op.owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.property_collaborators pc
    WHERE pc.property_id = _property_id
      AND pc.collaborator_id = _user_id
      AND pc.status = 'accepted'
  );
$$;

-- Helper: does the user have edit access (owner or manager)?
CREATE OR REPLACE FUNCTION public.has_property_edit_access(_property_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = _property_id AND op.owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.property_collaborators pc
    WHERE pc.property_id = _property_id
      AND pc.collaborator_id = _user_id
      AND pc.status = 'accepted'
      AND pc.role::text = 'manager'
  );
$$;

-- Helper: list of property ids the user has access to (owner OR accepted collaborator)
CREATE OR REPLACE FUNCTION public.user_accessible_property_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.owner_properties WHERE owner_id = _user_id
  UNION
  SELECT property_id FROM public.property_collaborators
    WHERE collaborator_id = _user_id AND status = 'accepted';
$$;

-- =========================
-- ROOMS: collaborators can view + (managers) edit shared-property rooms
-- =========================
DROP POLICY IF EXISTS "Collaborators can view shared property rooms" ON public.rooms;
CREATE POLICY "Collaborators can view shared property rooms"
  ON public.rooms FOR SELECT
  USING (property_id IS NOT NULL AND public.has_property_access(property_id, auth.uid()));

DROP POLICY IF EXISTS "Managers can update shared property rooms" ON public.rooms;
CREATE POLICY "Managers can update shared property rooms"
  ON public.rooms FOR UPDATE
  USING (property_id IS NOT NULL AND public.has_property_edit_access(property_id, auth.uid()));

DROP POLICY IF EXISTS "Managers can insert rooms in shared property" ON public.rooms;
CREATE POLICY "Managers can insert rooms in shared property"
  ON public.rooms FOR INSERT
  WITH CHECK (property_id IS NOT NULL AND public.has_property_edit_access(property_id, auth.uid()));

-- =========================
-- RELATIONSHIPS: collaborators on the property can view/manage
-- =========================
DROP POLICY IF EXISTS "Collaborators can view shared property relationships" ON public.relationships;
CREATE POLICY "Collaborators can view shared property relationships"
  ON public.relationships FOR SELECT
  USING (property_id IS NOT NULL AND public.has_property_access(property_id, auth.uid()));

DROP POLICY IF EXISTS "Managers can update shared property relationships" ON public.relationships;
CREATE POLICY "Managers can update shared property relationships"
  ON public.relationships FOR UPDATE
  USING (property_id IS NOT NULL AND public.has_property_edit_access(property_id, auth.uid()));

-- =========================
-- NOTICES: collaborators can view; managers can create
-- =========================
DROP POLICY IF EXISTS "Collaborators can view shared property notices" ON public.notices;
CREATE POLICY "Collaborators can view shared property notices"
  ON public.notices FOR SELECT
  USING (property_id IS NOT NULL AND public.has_property_access(property_id, auth.uid()));

DROP POLICY IF EXISTS "Managers can create notices in shared property" ON public.notices;
CREATE POLICY "Managers can create notices in shared property"
  ON public.notices FOR INSERT
  WITH CHECK (property_id IS NOT NULL AND public.has_property_edit_access(property_id, auth.uid()));

-- =========================
-- PAYMENTS: collaborators on the property can view; managers can insert/update
-- =========================
DROP POLICY IF EXISTS "Collaborators can view shared property payments" ON public.payments;
CREATE POLICY "Collaborators can view shared property payments"
  ON public.payments FOR SELECT
  USING (property_id IS NOT NULL AND public.has_property_access(property_id, auth.uid()));

DROP POLICY IF EXISTS "Managers can update shared property payments" ON public.payments;
CREATE POLICY "Managers can update shared property payments"
  ON public.payments FOR UPDATE
  USING (property_id IS NOT NULL AND public.has_property_edit_access(property_id, auth.uid()));

DROP POLICY IF EXISTS "Managers can insert shared property payments" ON public.payments;
CREATE POLICY "Managers can insert shared property payments"
  ON public.payments FOR INSERT
  WITH CHECK (property_id IS NOT NULL AND public.has_property_edit_access(property_id, auth.uid()));

-- =========================
-- BOOKING_REQUESTS: collaborators view; managers update
-- =========================
DROP POLICY IF EXISTS "Collaborators can view shared property booking requests" ON public.booking_requests;
CREATE POLICY "Collaborators can view shared property booking requests"
  ON public.booking_requests FOR SELECT
  USING (property_id IS NOT NULL AND public.has_property_access(property_id, auth.uid()));

DROP POLICY IF EXISTS "Managers can update shared property booking requests" ON public.booking_requests;
CREATE POLICY "Managers can update shared property booking requests"
  ON public.booking_requests FOR UPDATE
  USING (property_id IS NOT NULL AND public.has_property_edit_access(property_id, auth.uid()));

-- =========================
-- RENT_STATUS, DOCUMENTS, COMPLAINTS, MANUAL_PAYMENTS, METER_PHOTOS, RENTAL_AGREEMENTS, RENT_MANAGEMENT
-- via relationship.property_id
-- =========================
DROP POLICY IF EXISTS "Collaborators can view rent_status via relationship" ON public.rent_status;
CREATE POLICY "Collaborators can view rent_status via relationship"
  ON public.rent_status FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = rent_status.relationship_id
      AND r.property_id IS NOT NULL
      AND public.has_property_access(r.property_id, auth.uid())
  ));

DROP POLICY IF EXISTS "Collaborators can view documents via relationship" ON public.documents;
CREATE POLICY "Collaborators can view documents via relationship"
  ON public.documents FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = documents.relationship_id
      AND r.property_id IS NOT NULL
      AND public.has_property_access(r.property_id, auth.uid())
  ));

DROP POLICY IF EXISTS "Collaborators can view complaints via relationship" ON public.complaints;
CREATE POLICY "Collaborators can view complaints via relationship"
  ON public.complaints FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = complaints.relationship_id
      AND r.property_id IS NOT NULL
      AND public.has_property_access(r.property_id, auth.uid())
  ));

DROP POLICY IF EXISTS "Collaborators can view manual_payments via relationship" ON public.manual_payments;
CREATE POLICY "Collaborators can view manual_payments via relationship"
  ON public.manual_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = manual_payments.relationship_id
      AND r.property_id IS NOT NULL
      AND public.has_property_access(r.property_id, auth.uid())
  ));

DROP POLICY IF EXISTS "Collaborators can view meter_photos via relationship" ON public.meter_photos;
CREATE POLICY "Collaborators can view meter_photos via relationship"
  ON public.meter_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = meter_photos.relationship_id
      AND r.property_id IS NOT NULL
      AND public.has_property_access(r.property_id, auth.uid())
  ));

DROP POLICY IF EXISTS "Collaborators can view rental_agreements" ON public.rental_agreements;
CREATE POLICY "Collaborators can view rental_agreements"
  ON public.rental_agreements FOR SELECT
  USING (property_id IS NOT NULL AND public.has_property_access(property_id, auth.uid()));

DROP POLICY IF EXISTS "Collaborators can view rent_management" ON public.rent_management;
CREATE POLICY "Collaborators can view rent_management"
  ON public.rent_management FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.owner_id = rent_management.owner_id
      AND r.renter_id = rent_management.renter_id
      AND r.property_id IS NOT NULL
      AND public.has_property_access(r.property_id, auth.uid())
  ));

-- OWNER_UPI_DETAILS: collaborators on any property of that owner can view (used by payment screens)
DROP POLICY IF EXISTS "Collaborators can view owner upi" ON public.owner_upi_details;
CREATE POLICY "Collaborators can view owner upi"
  ON public.owner_upi_details FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.property_collaborators pc
    JOIN public.owner_properties op ON op.id = pc.property_id
    WHERE op.owner_id = owner_upi_details.owner_id
      AND pc.collaborator_id = auth.uid()
      AND pc.status = 'accepted'
  ));
