-- Create referral_events table for clean, auditable referral tracking
CREATE TABLE public.referral_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  referral_code text NOT NULL,
  is_new_user boolean NOT NULL DEFAULT true,
  reward_amount numeric NOT NULL DEFAULT 200,
  reward_status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT referral_events_referred_id_unique UNIQUE (referred_id),
  CONSTRAINT referral_events_no_self_referral CHECK (referrer_id <> referred_id)
);

-- Enable RLS
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view referrals they made"
  ON public.referral_events
  FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referral"
  ON public.referral_events
  FOR SELECT
  USING (auth.uid() = referred_id);

CREATE POLICY "System can insert referral events"
  ON public.referral_events
  FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- Create index for faster lookups
CREATE INDEX idx_referral_events_referrer ON public.referral_events(referrer_id);
CREATE INDEX idx_referral_events_code ON public.referral_events(referral_code);

-- Function to get referrer_id from referral_code
CREATE OR REPLACE FUNCTION public.get_referrer_from_code(p_referral_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Find referrer from existing referrals table (where referred_id is NULL = original code)
  SELECT referrer_id INTO v_referrer_id
  FROM public.referrals
  WHERE referral_code = p_referral_code
    OR referral_code LIKE p_referral_code || '_%'
  LIMIT 1;
  
  RETURN v_referrer_id;
END;
$$;

-- Function to create referral event (only for new users)
CREATE OR REPLACE FUNCTION public.create_referral_event(p_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_user_created_at timestamp with time zone;
  v_user_last_sign_in timestamp with time zone;
  v_is_new_user boolean;
  v_result jsonb;
BEGIN
  -- Get current user info from auth.users
  SELECT created_at, last_sign_in_at 
  INTO v_user_created_at, v_user_last_sign_in
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if user is new (created_at equals last_sign_in_at within 5 seconds tolerance)
  v_is_new_user := (
    v_user_last_sign_in IS NULL 
    OR ABS(EXTRACT(EPOCH FROM (v_user_created_at - v_user_last_sign_in))) < 5
  );
  
  -- If not a new user, return early
  IF NOT v_is_new_user THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'not_new_user',
      'message', 'Referral only valid for new users'
    );
  END IF;
  
  -- Get referrer from code
  v_referrer_id := public.get_referrer_from_code(p_referral_code);
  
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'invalid_code',
      'message', 'Invalid referral code'
    );
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'self_referral',
      'message', 'Cannot refer yourself'
    );
  END IF;
  
  -- Check if already referred
  IF EXISTS (SELECT 1 FROM public.referral_events WHERE referred_id = auth.uid()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_referred',
      'message', 'User already has a referral'
    );
  END IF;
  
  -- Insert referral event
  INSERT INTO public.referral_events (
    referrer_id,
    referred_id,
    referral_code,
    is_new_user,
    reward_amount,
    reward_status
  ) VALUES (
    v_referrer_id,
    auth.uid(),
    p_referral_code,
    true,
    200,
    'pending'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Referral recorded successfully',
    'referrer_id', v_referrer_id
  );
  
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object(
    'success', false,
    'reason', 'duplicate',
    'message', 'Referral already exists'
  );
END;
$$;