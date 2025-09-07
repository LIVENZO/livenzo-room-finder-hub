-- Update fcm_tokens table to add foreign key constraint and proper policies
ALTER TABLE public.fcm_tokens 
DROP CONSTRAINT IF EXISTS fcm_tokens_user_id_fkey;

ALTER TABLE public.fcm_tokens 
ADD CONSTRAINT fcm_tokens_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Drop existing policy and create proper RLS policies
DROP POLICY IF EXISTS "Allow insert for anon" ON public.fcm_tokens;

CREATE POLICY "Users can insert their own FCM tokens" 
ON public.fcm_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own FCM tokens" 
ON public.fcm_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own FCM tokens" 
ON public.fcm_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FCM tokens" 
ON public.fcm_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create database function to get FCM tokens for a user
CREATE OR REPLACE FUNCTION public.get_user_fcm_tokens(target_user_id UUID)
RETURNS TABLE(token TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fcm_tokens.token 
  FROM public.fcm_tokens 
  WHERE fcm_tokens.user_id = target_user_id;
$$;