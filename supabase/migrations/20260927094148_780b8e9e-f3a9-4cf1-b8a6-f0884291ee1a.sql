CREATE POLICY "No direct client access to restaurant redemptions"
ON public.restaurant_offer_redemptions
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);