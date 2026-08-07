CREATE UNIQUE INDEX IF NOT EXISTS user_role_assignments_user_id_key ON public.user_role_assignments (user_id);

DROP POLICY IF EXISTS "Users can update their own role assignment" ON public.user_role_assignments;
CREATE POLICY "Users can update their own role assignment"
ON public.user_role_assignments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_role_assignments TO authenticated;
GRANT ALL ON public.user_role_assignments TO service_role;