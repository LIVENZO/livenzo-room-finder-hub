-- Create INSERT policy to allow owners to create their own UPI details
CREATE POLICY "Owners can create their own UPI details"
ON public.owner_upi_details
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Ensure updates keep the row bound to the owner
CREATE POLICY "Owners can update their own UPI details (check)"
ON public.owner_upi_details
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());