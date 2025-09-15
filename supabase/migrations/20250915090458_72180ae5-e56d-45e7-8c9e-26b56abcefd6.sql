-- Add firebase_uid column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_firebase_uid 
ON public.user_profiles(firebase_uid);

-- Drop existing restrictive policies to allow upsert by firebase_uid
DROP POLICY IF EXISTS "Allow upsert by firebase_uid" ON public.user_profiles;

-- Create new policy for Firebase auth sync
CREATE POLICY "Allow firebase sync operations"
ON public.user_profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);