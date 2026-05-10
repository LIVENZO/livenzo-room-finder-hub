-- Owner-to-Owner collaboration system
CREATE TYPE public.collaborator_role AS ENUM ('manager', 'viewer');

CREATE TABLE public.property_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  collaborator_id uuid NOT NULL,
  role public.collaborator_role,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, collaborator_id)
);

CREATE INDEX idx_pc_owner ON public.property_collaborators(owner_id);
CREATE INDEX idx_pc_collab ON public.property_collaborators(collaborator_id);
CREATE INDEX idx_pc_property ON public.property_collaborators(property_id);

ALTER TABLE public.property_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own collaborations"
  ON public.property_collaborators FOR SELECT
  USING (owner_id = auth.uid() OR collaborator_id = auth.uid());

-- Inserts/updates/deletes go through SECURITY DEFINER RPCs only.

CREATE TRIGGER pc_updated_at
  BEFORE UPDATE ON public.property_collaborators
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- Helper: returns role for a user on a property ('owner' if owner, else collaborator role, else null)
CREATE OR REPLACE FUNCTION public.get_property_role(p_property_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_role public.collaborator_role;
BEGIN
  SELECT owner_id INTO v_owner FROM public.owner_properties WHERE id = p_property_id;
  IF v_owner = p_user_id THEN
    RETURN 'owner';
  END IF;
  SELECT role INTO v_role FROM public.property_collaborators
   WHERE property_id = p_property_id AND collaborator_id = p_user_id AND status = 'accepted';
  IF v_role IS NULL THEN RETURN NULL; END IF;
  RETURN v_role::text;
END;
$$;

-- Send a collaboration request to another property by its public_id
CREATE OR REPLACE FUNCTION public.send_collaboration_request(p_property_public_id text)
RETURNS public.property_collaborators
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target public.owner_properties%ROWTYPE;
  v_caller_role text;
  v_existing public.property_collaborators%ROWTYPE;
  v_row public.property_collaborators;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Caller must be an owner
  SELECT role INTO v_caller_role FROM public.user_role_assignments
    WHERE user_id = auth.uid() LIMIT 1;
  IF v_caller_role IS NULL OR v_caller_role <> 'owner' THEN
    RAISE EXCEPTION 'Only owners can send collaboration requests';
  END IF;

  SELECT * INTO v_target FROM public.owner_properties
   WHERE public_id = p_property_public_id AND is_active = true LIMIT 1;
  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF v_target.owner_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot collaborate on your own property';
  END IF;

  SELECT * INTO v_existing FROM public.property_collaborators
   WHERE property_id = v_target.id AND collaborator_id = auth.uid();

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.status IN ('pending','accepted') THEN
      RAISE EXCEPTION 'A request already exists for this property';
    END IF;
    UPDATE public.property_collaborators
       SET status = 'pending', role = NULL, invited_by = auth.uid(),
           owner_id = v_target.owner_id, updated_at = now()
     WHERE id = v_existing.id
     RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  INSERT INTO public.property_collaborators (property_id, owner_id, collaborator_id, status, invited_by)
  VALUES (v_target.id, v_target.owner_id, auth.uid(), 'pending', auth.uid())
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- Property owner responds to incoming request: accept (with role) or decline
CREATE OR REPLACE FUNCTION public.respond_collaboration_request(
  p_request_id uuid,
  p_action text,
  p_role public.collaborator_role DEFAULT NULL
)
RETURNS public.property_collaborators
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.property_collaborators;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.property_collaborators WHERE id = p_request_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Only the property owner can respond
  IF v_row.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  IF p_action = 'accept' THEN
    IF p_role IS NULL THEN
      RAISE EXCEPTION 'Role is required to accept';
    END IF;
    UPDATE public.property_collaborators
       SET status = 'accepted', role = p_role, updated_at = now()
     WHERE id = p_request_id
     RETURNING * INTO v_row;
  ELSIF p_action = 'decline' THEN
    UPDATE public.property_collaborators
       SET status = 'declined', updated_at = now()
     WHERE id = p_request_id
     RETURNING * INTO v_row;
  ELSE
    RAISE EXCEPTION 'Invalid action';
  END IF;

  RETURN v_row;
END;
$$;

-- Owner revokes a collaborator
CREATE OR REPLACE FUNCTION public.revoke_collaborator(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM public.property_collaborators WHERE id = p_request_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.property_collaborators
     SET status = 'revoked', updated_at = now()
   WHERE id = p_request_id;
END;
$$;

-- List collaborations involving caller (owner-side or collaborator-side), enriched
CREATE OR REPLACE FUNCTION public.get_my_collaborations()
RETURNS TABLE (
  id uuid,
  property_id uuid,
  property_name text,
  property_public_id text,
  owner_id uuid,
  owner_name text,
  owner_avatar text,
  collaborator_id uuid,
  collaborator_name text,
  collaborator_avatar text,
  role public.collaborator_role,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  i_am text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    pc.id, pc.property_id,
    op.hostel_pg_name AS property_name,
    op.public_id AS property_public_id,
    pc.owner_id,
    COALESCE(op_owner.hostel_pg_name, up_owner.full_name) AS owner_name,
    up_owner.avatar_url AS owner_avatar,
    pc.collaborator_id,
    COALESCE(up_collab.full_name, 'Owner') AS collaborator_name,
    up_collab.avatar_url AS collaborator_avatar,
    pc.role, pc.status, pc.created_at, pc.updated_at,
    CASE WHEN pc.owner_id = auth.uid() THEN 'owner' ELSE 'collaborator' END AS i_am
  FROM public.property_collaborators pc
  LEFT JOIN public.owner_properties op ON op.id = pc.property_id
  LEFT JOIN public.user_profiles up_owner ON up_owner.id = pc.owner_id
  LEFT JOIN public.owner_properties op_owner
         ON op_owner.owner_id = pc.owner_id AND op_owner.is_primary = true
  LEFT JOIN public.user_profiles up_collab ON up_collab.id = pc.collaborator_id
  WHERE pc.owner_id = auth.uid() OR pc.collaborator_id = auth.uid()
  ORDER BY pc.created_at DESC;
END;
$$;