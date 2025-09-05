-- Tighten RLS to prevent public access to owner_phone via direct table reads
-- Remove permissive public SELECT policy
DROP POLICY IF EXISTS "Public users can view available rooms without phone" ON public.rooms;

-- Allow SELECT only for authenticated users; public users must use RPC which masks phone
CREATE POLICY "Authenticated users can view available rooms" 
ON public.rooms 
FOR SELECT 
USING (
  available = true AND auth.uid() IS NOT NULL
);
