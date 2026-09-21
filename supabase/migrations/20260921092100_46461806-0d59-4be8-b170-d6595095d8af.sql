DROP POLICY IF EXISTS "Public can view rooms through secure view" ON public.rooms;

CREATE POLICY "Public can view available rooms"
ON public.rooms
FOR SELECT
TO anon
USING (available = true);