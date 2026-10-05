-- Standardize every referral reward at ₹500.
ALTER TABLE public.referral_events
  ALTER COLUMN reward_amount SET DEFAULT 500;

UPDATE public.referral_events
SET reward_amount = 500
WHERE reward_amount IS DISTINCT FROM 500;

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
BEGIN
  SELECT created_at, last_sign_in_at
  INTO v_user_created_at, v_user_last_sign_in
  FROM auth.users
  WHERE id = auth.uid();

  v_is_new_user := (
    v_user_last_sign_in IS NULL
    OR ABS(EXTRACT(EPOCH FROM (v_user_created_at - v_user_last_sign_in))) < 5
  );

  IF NOT v_is_new_user THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'not_new_user',
      'message', 'Referral only valid for new users'
    );
  END IF;

  v_referrer_id := public.get_referrer_from_code(p_referral_code);

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'invalid_code',
      'message', 'Invalid referral code'
    );
  END IF;

  IF v_referrer_id = auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'self_referral',
      'message', 'Cannot refer yourself'
    );
  END IF;

  IF EXISTS (SELECT 1 FROM public.referral_events WHERE referred_id = auth.uid()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_referred',
      'message', 'User already has a referral'
    );
  END IF;

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
    500,
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