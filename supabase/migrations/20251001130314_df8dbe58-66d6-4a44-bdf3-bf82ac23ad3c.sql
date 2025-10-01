-- Ensure unique index for monthly rent status per relationship
CREATE UNIQUE INDEX IF NOT EXISTS rent_status_relationship_billing_month_uidx 
  ON public.rent_status(relationship_id, billing_month);

-- Sync rent_status when rental_agreements change, per billing month
CREATE OR REPLACE FUNCTION public.sync_rent_status_from_agreement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_relationship_id UUID;
  v_due_date DATE;
  v_billing_month TEXT;
BEGIN
  -- Determine relationship for owner/renter pair
  SELECT id INTO v_relationship_id
  FROM public.relationships
  WHERE owner_id = NEW.owner_id
    AND renter_id = NEW.renter_id
    AND status = 'accepted'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_relationship_id IS NULL THEN
    RETURN NEW; -- No active relationship; nothing to sync
  END IF;

  v_due_date := COALESCE(NEW.next_due_date, NEW.due_date, CURRENT_DATE + INTERVAL '1 month');
  v_billing_month := to_char(v_due_date, 'YYYY-MM');

  INSERT INTO public.rent_status (
    relationship_id,
    current_amount,
    due_date,
    billing_month,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_relationship_id,
    NEW.monthly_rent,
    v_due_date,
    v_billing_month,
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (relationship_id, billing_month)
  DO UPDATE SET
    current_amount = EXCLUDED.current_amount,
    due_date = EXCLUDED.due_date,
    updated_at = NOW();

  RETURN NEW;
END;
$$;
