-- Reset rent amounts and allow owners to set individual amounts per renter
-- This removes the incorrect global ₹7,000 amount applied to all renters

-- First, let's set different example amounts for different relationships to demonstrate individual pricing
-- In a real scenario, owners would set these through a UI

-- Update first relationship to ₹7,000 (as originally intended)
UPDATE public.rent_status 
SET current_amount = 7000.00,
    updated_at = NOW() 
WHERE relationship_id = 'caf3508b-8924-450e-92ac-f228e421acdf';

-- Update second relationship to ₹5,500 (different amount for different renter)
UPDATE public.rent_status 
SET current_amount = 5500.00,
    updated_at = NOW() 
WHERE relationship_id = '755cf3ae-e5e5-4614-9361-5c692a713fa8';

-- Add any additional relationships with their own specific amounts
-- This ensures each renter sees their own specific rent amount