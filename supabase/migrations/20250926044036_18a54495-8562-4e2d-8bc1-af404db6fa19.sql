-- Add a "Set Rent" button functionality by creating a modal for owners to set monthly rent for renters
-- This will enhance the rental_agreements table to better handle monthly rent settings

-- First, ensure rental_agreements table has proper structure for setting rent
-- Add any missing columns if needed
ALTER TABLE public.rental_agreements 
ADD COLUMN IF NOT EXISTS next_due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month');

-- Create or update the rent_status table to sync with rental_agreements
-- Ensure rent_status gets updated when rental_agreements change
CREATE OR REPLACE FUNCTION public.sync_rent_status_from_agreement()
RETURNS TRIGGER AS $$
BEGIN
  -- When rental agreement is updated, sync the rent_status table
  INSERT INTO public.rent_status (
    relationship_id,
    current_amount,
    due_date,
    status,
    created_at,
    updated_at
  )
  VALUES (
    (SELECT id FROM public.relationships WHERE owner_id = NEW.owner_id AND renter_id = NEW.renter_id AND status = 'accepted' LIMIT 1),
    NEW.monthly_rent,
    COALESCE(NEW.next_due_date, NEW.due_date, CURRENT_DATE + INTERVAL '1 month'),
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (relationship_id) 
  DO UPDATE SET
    current_amount = NEW.monthly_rent,
    due_date = COALESCE(NEW.next_due_date, NEW.due_date, CURRENT_DATE + INTERVAL '1 month'),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-sync when rental agreement is updated
DROP TRIGGER IF EXISTS trigger_sync_rent_status ON public.rental_agreements;
CREATE TRIGGER trigger_sync_rent_status
  AFTER INSERT OR UPDATE ON public.rental_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_rent_status_from_agreement();

-- Create a function for owners to set monthly rent for their renters
CREATE OR REPLACE FUNCTION public.set_renter_monthly_rent(
  p_renter_id UUID,
  p_monthly_rent NUMERIC,
  p_next_due_date DATE DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Create or update rental agreement
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
    monthly_rent = p_monthly_rent,
    due_date = p_next_due_date,
    next_due_date = p_next_due_date,
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
$$;