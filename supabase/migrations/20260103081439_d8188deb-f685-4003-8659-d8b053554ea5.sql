-- Update the apply_referral_code function to set status = 'pending' and store original code
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_referral_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id UUID;
  v_unique_code TEXT;
BEGIN
  -- Get the referrer from the original referral code
  SELECT referrer_id INTO v_referrer_id
  FROM public.referrals
  WHERE referral_code = p_referral_code
    AND referred_id IS NULL
    AND referrer_id != auth.uid() -- Prevent self-referral
  LIMIT 1;
  
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user was already referred
  IF EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referred_id = auth.uid()
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Generate a unique code for this referral relationship (append user suffix for uniqueness)
  v_unique_code := p_referral_code || '_' || substr(auth.uid()::text, 1, 8);
  
  -- Create referral relationship with status = 'pending'
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, auth.uid(), v_unique_code, 'pending');
  
  RETURN TRUE;
END;
$$;