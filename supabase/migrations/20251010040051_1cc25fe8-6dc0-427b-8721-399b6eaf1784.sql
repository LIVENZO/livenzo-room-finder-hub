-- Fix rent_status table to allow pending, paid, unpaid states
-- Drop existing constraint if it exists
ALTER TABLE rent_status DROP CONSTRAINT IF EXISTS rent_status_status_check;

-- Add new constraint allowing all three states
ALTER TABLE rent_status ADD CONSTRAINT rent_status_status_check 
  CHECK (status IN ('pending', 'paid', 'unpaid'));

-- Drop existing triggers and functions for clean slate
DROP TRIGGER IF EXISTS auto_reset_rent_status_before_update ON rent_status;
DROP TRIGGER IF EXISTS init_rent_status_on_acceptance ON relationships;
DROP FUNCTION IF EXISTS auto_reset_rent_status_monthly();
DROP FUNCTION IF EXISTS initialize_rent_status();

-- Create function to auto-reset rent status monthly
CREATE OR REPLACE FUNCTION public.auto_reset_rent_status_monthly()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_due_date DATE;
  v_new_billing_month TEXT;
BEGIN
  -- Calculate next due date (one month after current due date)
  v_next_due_date := NEW.due_date + INTERVAL '1 month';
  
  -- Get what billing month it should be now
  v_new_billing_month := to_char(CURRENT_DATE, 'YYYY-MM');
  
  -- If current date has passed one full month from due date, reset to pending
  IF CURRENT_DATE >= v_next_due_date AND NEW.status != 'pending' THEN
    NEW.status := 'pending';
    NEW.due_date := v_next_due_date;
    NEW.billing_month := v_new_billing_month;
    NEW.updated_at := NOW();
    NEW.last_payment_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic monthly reset
CREATE TRIGGER auto_reset_rent_status_before_update
BEFORE UPDATE ON rent_status
FOR EACH ROW
EXECUTE FUNCTION auto_reset_rent_status_monthly();

-- Create function to initialize rent status when relationship is accepted
CREATE OR REPLACE FUNCTION public.initialize_rent_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due_date DATE;
  v_monthly_rent NUMERIC;
  v_billing_month TEXT;
BEGIN
  -- Only proceed if status is changing to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get rental agreement details
    SELECT monthly_rent, COALESCE(next_due_date, due_date, CURRENT_DATE)
    INTO v_monthly_rent, v_due_date
    FROM rental_agreements
    WHERE owner_id = NEW.owner_id 
      AND renter_id = NEW.renter_id
      AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If no agreement, use default values
    IF v_monthly_rent IS NULL THEN
      v_monthly_rent := 1200.00;
    END IF;
    
    IF v_due_date IS NULL THEN
      v_due_date := CURRENT_DATE;
    END IF;
    
    v_billing_month := to_char(v_due_date, 'YYYY-MM');
    
    -- Create or update rent_status record with pending status
    INSERT INTO rent_status (
      relationship_id,
      current_amount,
      due_date,
      billing_month,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      v_monthly_rent,
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for initializing rent status on relationship acceptance
CREATE TRIGGER init_rent_status_on_acceptance
AFTER UPDATE ON relationships
FOR EACH ROW
EXECUTE FUNCTION initialize_rent_status();