-- Add RLS policy for owners to create payments
CREATE POLICY "Owners can create payments for their renters" 
ON public.payments 
FOR INSERT 
WITH CHECK (
  owner_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.relationships 
    WHERE relationships.owner_id = auth.uid() 
    AND relationships.renter_id = payments.renter_id 
    AND relationships.status = 'accepted'
  )
);

-- Make property_id nullable since it's not always needed for manual rent payments
ALTER TABLE public.payments ALTER COLUMN property_id DROP NOT NULL;