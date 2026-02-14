-- Allow users to update their own booking requests
CREATE POLICY "Users can update their own booking requests"
ON public.booking_requests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);