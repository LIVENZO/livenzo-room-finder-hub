-- Ensure a single row per user for fcm_tokens so ON CONFLICT (user_id) works
CREATE UNIQUE INDEX IF NOT EXISTS fcm_tokens_user_id_unique ON public.fcm_tokens (user_id);

-- Normalize RLS policies for fcm_tokens to clearly allow self-only CRUD
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Drop legacy/duplicate policies if they exist (to avoid restrictive conflicts)
DROP POLICY IF EXISTS "Allow user to update own token" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Allow insert of own token" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can delete their own FCM tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can manage their own FCM tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Allow users to manage their own tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can view their own FCM tokens" ON public.fcm_tokens;

-- Create minimal, explicit, self-scoped policies
CREATE POLICY fcm_select_own
ON public.fcm_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY fcm_insert_own
ON public.fcm_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY fcm_update_own
ON public.fcm_tokens
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY fcm_delete_own
ON public.fcm_tokens
FOR DELETE
USING (auth.uid() = user_id);