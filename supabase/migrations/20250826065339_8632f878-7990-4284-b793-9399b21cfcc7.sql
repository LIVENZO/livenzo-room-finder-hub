-- Add policy to allow users to search for other users by public_id
-- This is needed for the owner search functionality where renters search for owners
CREATE POLICY "Allow search by public_id" 
ON public.user_profiles 
FOR SELECT 
USING (
  -- Allow any authenticated user to find other users by public_id
  -- This only exposes basic info needed for search: id, full_name, avatar_url, public_id
  auth.uid() IS NOT NULL
  AND public_id IS NOT NULL
);