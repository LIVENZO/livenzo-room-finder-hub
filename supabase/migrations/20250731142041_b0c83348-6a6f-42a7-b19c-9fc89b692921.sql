-- Remove the foreign key constraint from payments.renter_id to renters table
-- since the app uses relationships table for owner-renter connections
-- and make renter_id reference user_profiles directly

-- First check if the foreign key exists and drop it
DO $$ 
BEGIN
    -- Drop foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%payment_renter_id_fkey%' 
        AND table_name = 'payments'
    ) THEN
        ALTER TABLE public.payments DROP CONSTRAINT payment_renter_id_fkey;
    END IF;
END $$;

-- Add a new foreign key constraint that references user_profiles
-- This makes more sense since renter_id in payments should reference actual users
ALTER TABLE public.payments 
ADD CONSTRAINT payments_renter_id_fkey 
FOREIGN KEY (renter_id) REFERENCES auth.users(id) ON DELETE CASCADE;