-- Create referrals table to track referral relationships
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'booking_completed', 'reward_credited')),
  reward_amount NUMERIC DEFAULT 200,
  reward_credited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer or referred)
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Users can create referrals for themselves
CREATE POLICY "Users can create their own referral codes"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id AND referred_id IS NULL);

-- System can update referral status (via service role in edge functions)
CREATE POLICY "Users can update their pending referrals"
ON public.referrals
FOR UPDATE
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'REF';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to get or create user's referral code
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code()
RETURNS TABLE(referral_code TEXT, referral_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_code TEXT;
  v_referral_id UUID;
  v_new_code TEXT;
BEGIN
  -- Check if user already has a referral code
  SELECT r.referral_code, r.id INTO v_referral_code, v_referral_id
  FROM public.referrals r
  WHERE r.referrer_id = auth.uid() AND r.referred_id IS NULL
  LIMIT 1;
  
  IF v_referral_code IS NOT NULL THEN
    RETURN QUERY SELECT v_referral_code, v_referral_id;
    RETURN;
  END IF;
  
  -- Generate unique code
  LOOP
    v_new_code := public.generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referrals WHERE public.referrals.referral_code = v_new_code);
  END LOOP;
  
  -- Create new referral entry
  INSERT INTO public.referrals (referrer_id, referral_code)
  VALUES (auth.uid(), v_new_code)
  RETURNING public.referrals.referral_code, id INTO v_referral_code, v_referral_id;
  
  RETURN QUERY SELECT v_referral_code, v_referral_id;
END;
$$;

-- Function to apply referral code on signup
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_referral_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Get the referrer
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
  
  -- Create referral relationship
  INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, auth.uid(), p_referral_code || '_' || substr(gen_random_uuid()::text, 1, 8), 'signed_up');
  
  RETURN TRUE;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();