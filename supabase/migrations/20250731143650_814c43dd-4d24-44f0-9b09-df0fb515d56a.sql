-- Drop the current foreign key constraint and add the correct one
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_renter_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_renter_id_fkey FOREIGN KEY (renter_id) REFERENCES auth.users(id) ON DELETE CASCADE;