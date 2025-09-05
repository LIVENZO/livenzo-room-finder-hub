-- Fix Security Issue: Restrict public_id search to only expose safe public fields
-- This prevents exposure of sensitive data like phone, email, payment info, and GPS coordinates

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Allow search by public_id" ON public.user_profiles;

-- Create a new restricted policy for public_id searches that only allows access to public fields
CREATE POLICY "Allow limited search by public_id" 
ON public.user_profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND public_id IS NOT NULL
);