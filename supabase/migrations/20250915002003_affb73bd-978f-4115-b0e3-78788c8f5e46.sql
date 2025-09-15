-- Add permissive own-row policy for user_profiles to ensure authenticated users can read/write their profile and allow session-based access
create policy if not exists "Allow authenticated read/write own profile"
  on public.user_profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
