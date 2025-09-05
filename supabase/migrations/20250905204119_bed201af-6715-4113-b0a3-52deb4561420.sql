-- Fix Security Issue: Restrict public access to reviews table
-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Create new policy requiring authentication to view reviews
CREATE POLICY "Authenticated users can view reviews" 
ON public.reviews 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Optional: Also enable leaked password protection (Auth setting)
-- Note: This needs to be enabled manually in Supabase Auth settings
-- Navigate to: Authentication > Settings > Password Protection