-- Add a dedicated INSERT policy for owner_upi_details to allow owners to create their own UPI details
CREATE POLICY IF NOT EXISTS "Owners can create their own UPI details"
ON public.owner_upi_details
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Optionally, ensure owners cannot change owner_id on update (safety)
-- This adds an UPDATE policy with WITH CHECK to keep owner_id bound to auth.uid()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'owner_upi_details' 
      AND policyname = 'Owners can update their own UPI details (check)'
  ) THEN
    CREATE POLICY "Owners can update their own UPI details (check)"
    ON public.owner_upi_details
    FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;