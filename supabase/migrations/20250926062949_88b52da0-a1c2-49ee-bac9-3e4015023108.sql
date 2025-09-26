-- Add unique constraint for rental agreements
ALTER TABLE public.rental_agreements 
ADD CONSTRAINT unique_owner_renter_property 
UNIQUE (owner_id, renter_id, property_id);

-- Update the set_renter_monthly_rent function to fix the ON CONFLICT issue
CREATE OR REPLACE FUNCTION public.set_renter_monthly_rent(p_renter_id uuid, p_monthly_rent numeric, p_next_due_date date DEFAULT NULL::date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_relationship_id UUID;
  v_agreement_id UUID;
  v_result jsonb;
BEGIN
  -- Check if owner has accepted relationship with renter
  SELECT id INTO v_relationship_id
  FROM public.relationships
  WHERE owner_id = auth.uid()
    AND renter_id = p_renter_id
    AND status = 'accepted'
    AND COALESCE(archived, false) = false
  LIMIT 1;

  IF v_relationship_id IS NULL THEN
    RAISE EXCEPTION 'No active relationship found with this renter';
  END IF;

  -- Set default due date if not provided
  IF p_next_due_date IS NULL THEN
    p_next_due_date := CURRENT_DATE + INTERVAL '1 month';
  END IF;

  -- Create or update rental agreement with proper conflict resolution
  INSERT INTO public.rental_agreements (
    owner_id,
    renter_id,
    property_id,
    monthly_rent,
    due_date,
    next_due_date,
    status,
    start_date,
    created_at,
    updated_at
  )
  VALUES (
    auth.uid(),
    p_renter_id,
    auth.uid(), -- Using owner_id as property_id for now
    p_monthly_rent,
    p_next_due_date,
    p_next_due_date,
    'active',
    CURRENT_DATE,
    NOW(),
    NOW()
  )
  ON CONFLICT (owner_id, renter_id, property_id)
  DO UPDATE SET
    monthly_rent = EXCLUDED.monthly_rent,
    due_date = EXCLUDED.due_date,
    next_due_date = EXCLUDED.next_due_date,
    updated_at = NOW(),
    status = 'active';

  -- Get the agreement ID
  SELECT id INTO v_agreement_id
  FROM public.rental_agreements
  WHERE owner_id = auth.uid() AND renter_id = p_renter_id
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Return success response with details
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