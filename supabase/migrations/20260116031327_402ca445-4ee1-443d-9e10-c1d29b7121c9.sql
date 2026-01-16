-- Add phone column to user_role_assignments table for phone-based role conflict checking
ALTER TABLE public.user_role_assignments 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for faster phone lookups
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_phone 
ON public.user_role_assignments(phone) 
WHERE phone IS NOT NULL;

-- Create function to check phone role conflict
CREATE OR REPLACE FUNCTION public.check_phone_role_conflict(phone_param TEXT, requested_role TEXT)
RETURNS TABLE(has_conflict BOOLEAN, existing_role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_role TEXT;
BEGIN
  -- Check if this phone number already has a different role
  IF phone_param IS NOT NULL THEN
    SELECT role INTO v_existing_role
    FROM public.user_role_assignments
    WHERE phone = phone_param
    AND role != requested_role
    LIMIT 1;
    
    IF v_existing_role IS NOT NULL THEN
      RETURN QUERY SELECT TRUE, v_existing_role;
      RETURN;
    END IF;
  END IF;
  
  RETURN QUERY SELECT FALSE, NULL::TEXT;
END;
$$;