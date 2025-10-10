-- Fix create_document_record function to properly handle document_type enum casting

CREATE OR REPLACE FUNCTION public.create_document_record(
  p_relationship_id uuid,
  p_document_type text,
  p_file_path text,
  p_file_name text,
  p_file_type text,
  p_file_size integer
)
RETURNS documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result public.documents%ROWTYPE;
  _owner_id uuid;
  _renter_id uuid;
  _normalized_type text;
  _valid_types text[] := ARRAY['id_proof', 'income_proof', 'lease_agreement', 'reference', 'rental_agreement', 'utility_bill', 'other'];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Normalize and validate document_type
  _normalized_type := lower(trim(p_document_type));
  
  -- Map common synonyms to canonical enum labels
  CASE _normalized_type
    WHEN 'id', 'identity' THEN _normalized_type := 'id_proof';
    WHEN 'income' THEN _normalized_type := 'income_proof';
    WHEN 'agreement', 'lease' THEN _normalized_type := 'lease_agreement';
    WHEN 'rental' THEN _normalized_type := 'rental_agreement';
    WHEN 'utility', 'bill' THEN _normalized_type := 'utility_bill';
    WHEN '' THEN _normalized_type := 'other';
    ELSE NULL; -- Keep as is if not a synonym
  END CASE;
  
  -- Limit length to 50 chars max
  IF length(_normalized_type) > 50 THEN
    _normalized_type := substring(_normalized_type, 1, 50);
  END IF;
  
  -- If not in valid list, use 'other' as fallback
  IF NOT (_normalized_type = ANY(_valid_types)) THEN
    _normalized_type := 'other';
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

  -- Insert with explicit enum cast
  INSERT INTO public.documents(
    relationship_id, 
    user_id, 
    document_type, 
    file_path, 
    file_name, 
    file_type, 
    file_size, 
    status
  ) VALUES (
    p_relationship_id, 
    auth.uid(), 
    _normalized_type::document_type,  -- Explicit cast to enum
    p_file_path, 
    p_file_name, 
    p_file_type, 
    p_file_size, 
    'submitted'
  ) RETURNING * INTO result;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log full error and return friendly message
    RAISE EXCEPTION 'Unable to save document: %', SQLERRM;
END;
$$;