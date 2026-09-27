CREATE TABLE public.restaurant_offer_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint_hash text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  bill_amount numeric(12,2) NOT NULL,
  discount_amount numeric(12,2) NOT NULL,
  coupon_code text NOT NULL UNIQUE,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.restaurant_offer_redemptions TO service_role;

ALTER TABLE public.restaurant_offer_redemptions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.restaurant_offer_redemptions IS 'Private, server-managed restaurant offer redemption records. One redemption per app installation/device fingerprint.';
COMMENT ON COLUMN public.restaurant_offer_redemptions.device_fingerprint_hash IS 'SHA-256 hash of the app installation identifier; the raw identifier is never stored.';