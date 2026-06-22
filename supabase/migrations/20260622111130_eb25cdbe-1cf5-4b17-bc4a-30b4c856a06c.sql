
CREATE OR REPLACE FUNCTION public.set_renter_monthly_rent(p_renter_id uuid, p_monthly_rent numeric, p_next_due_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_relationship_id UUID;
  v_owner_id UUID;
  v_agreement_id UUID;
  v_property_id UUID;
  v_result jsonb;
BEGIN
  -- First try: caller is the owner directly
  SELECT id, owner_id INTO v_relationship_id, v_owner_id
  FROM public.relationships
  WHERE owner_id = auth.uid()
    AND renter_id = p_renter_id
    AND status = 'accepted'
    AND COALESCE(archived, false) = false
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Second try: caller is an accepted manager collaborator on a property of the renter's owner
  IF v_relationship_id IS NULL THEN
    SELECT r.id, r.owner_id INTO v_relationship_id, v_owner_id
    FROM public.relationships r
    WHERE r.renter_id = p_renter_id
      AND r.status = 'accepted'
      AND COALESCE(r.archived, false) = false
      AND EXISTS (
        SELECT 1 FROM public.property_collaborators pc
        JOIN public.owner_properties op ON op.id = pc.property_id
        WHERE pc.collaborator_id = auth.uid()
          AND pc.status = 'accepted'
          AND op.owner_id = r.owner_id
      )
    ORDER BY r.updated_at DESC
    LIMIT 1;
  END IF;

  IF v_relationship_id IS NULL THEN
    RAISE EXCEPTION 'No active relationship found with this renter';
  END IF;

  IF p_next_due_date IS NULL THEN
    p_next_due_date := CURRENT_DATE;
  END IF;

  -- Check for existing agreement using the real owner_id
  SELECT id, property_id INTO v_agreement_id, v_property_id
  FROM public.rental_agreements
  WHERE owner_id = v_owner_id
    AND renter_id = p_renter_id
    AND status = 'active'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_agreement_id IS NOT NULL THEN
    UPDATE public.rental_agreements
    SET
      monthly_rent = p_monthly_rent,
      due_date = p_next_due_date,
      next_due_date = p_next_due_date,
      updated_at = NOW(),
      status = 'active'
    WHERE id = v_agreement_id;
  ELSE
    v_property_id := v_owner_id;

    INSERT INTO public.rental_agreements (
      owner_id, renter_id, property_id, monthly_rent,
      due_date, next_due_date, status, start_date,
      created_at, updated_at
    )
    VALUES (
      v_owner_id, p_renter_id, v_property_id, p_monthly_rent,
      p_next_due_date, p_next_due_date, 'active', CURRENT_DATE,
      NOW(), NOW()
    )
    ON CONFLICT (owner_id, renter_id, property_id)
    DO UPDATE SET
      monthly_rent = EXCLUDED.monthly_rent,
      due_date = EXCLUDED.due_date,
      next_due_date = EXCLUDED.next_due_date,
      updated_at = NOW(),
      status = 'active';
  END IF;

  SELECT id INTO v_agreement_id
  FROM public.rental_agreements
  WHERE owner_id = v_owner_id
    AND renter_id = p_renter_id
    AND property_id = v_property_id
  ORDER BY updated_at DESC
  LIMIT 1;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Monthly rent set successfully',
    'agreement_id', v_agreement_id,
    'relationship_id', v_relationship_id,
    'monthly_rent', p_monthly_rent,
    'due_date', p_next_due_date
  );

  RETURN v_result;
END;
$function$;
