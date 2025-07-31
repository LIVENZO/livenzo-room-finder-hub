-- Update rent amounts from 25000 to 7000 as requested by user
UPDATE public.rent_status 
SET current_amount = 7000.00, 
    updated_at = NOW() 
WHERE current_amount = 25000.00;