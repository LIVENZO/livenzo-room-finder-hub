-- RPC helpers for robust inserts bypassing client-side RLS pitfalls (enforce checks inside)
-- 1) Create notice (owner -> renter)
CREATE OR REPLACE FUNCTION public.create_owner_notice(
  p_renter_id uuid,
  p_message text,
  p_title text DEFAULT NULL
) RETURNS public.notices AS $$
DECLARE
  result public.notices%ROWTYPE;
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
  VALUES (auth.uid(), p_renter_id, p_message, p_title)
  RETURNING * INTO result;

  RETURN result;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_owner_notice(uuid, text, text) TO authenticated;

-- 2) Submit complaint (renter -> owner)
CREATE OR REPLACE FUNCTION public.submit_complaint(
  p_relationship_id uuid,
  p_owner_id uuid,
  p_title text,
  p_description text
) RETURNS public.complaints AS $$
DECLARE
  result public.complaints%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate that the relationship matches renter (auth user) and owner, accepted & active
  IF NOT EXISTS (
    SELECT 1 FROM public.relationships r
    WHERE r.id = p_relationship_id
      AND r.owner_id = p_owner_id
      AND r.renter_id = auth.uid()
      AND r.status = 'accepted'
      AND COALESCE(r.archived, false) = false
  ) THEN
    RAISE EXCEPTION 'Invalid or unauthorized relationship';
  END IF;

  INSERT INTO public.complaints(relationship_id, renter_id, owner_id, title, description, status)
  VALUES (p_relationship_id, auth.uid(), p_owner_id, p_title, p_description, 'pending')
  RETURNING * INTO result;

  RETURN result;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.submit_complaint(uuid, uuid, text, text) TO authenticated;

-- 3) Create document record (owner or renter on the relationship)
CREATE OR REPLACE FUNCTION public.create_document_record(
  p_relationship_id uuid,
  p_document_type text,
  p_file_path text,
  p_file_name text,
  p_file_type text,
  p_file_size integer
) RETURNS public.documents AS $$
DECLARE
  result public.documents%ROWTYPE;
  _owner_id uuid;
  _renter_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure caller is part of the relationship and it's active
  SELECT owner_id, renter_id INTO _owner_id, _renter_id
  FROM public.relationships r
  WHERE r.id = p_relationship_id
    AND r.status = 'accepted'
    AND COALESCE(r.archived, false) = false
  LIMIT 1;

  IF NOT FOUND OR (auth.uid() <> _owner_id AND auth.uid() <> _renter_id) THEN
    RAISE EXCEPTION 'You are not part of this relationship';
  END IF;

  INSERT INTO public.documents(
    relationship_id, user_id, document_type, file_path, file_name, file_type, file_size, status
  ) VALUES (
    p_relationship_id, auth.uid(), p_document_type, p_file_path, p_file_name, p_file_type, p_file_size, 'submitted'
  ) RETURNING * INTO result;

  RETURN result;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_document_record(uuid, text, text, text, text, integer) TO authenticated;

-- Ensure push notification triggers exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_send_push_on_notice') THEN
    CREATE TRIGGER tr_send_push_on_notice
    AFTER INSERT ON public.notices
    FOR EACH ROW EXECUTE FUNCTION public.notify_send_push_for_notice();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_send_push_on_document') THEN
    CREATE TRIGGER tr_send_push_on_document
    AFTER INSERT ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.notify_send_push_for_document();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_send_push_on_complaint') THEN
    CREATE TRIGGER tr_send_push_on_complaint
    AFTER INSERT ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.notify_send_push_for_complaint();
  END IF;
END $$;