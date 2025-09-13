-- Allow phone-only users by making email optional in user_role_assignments
ALTER TABLE public.user_role_assignments
  ALTER COLUMN email DROP NOT NULL;