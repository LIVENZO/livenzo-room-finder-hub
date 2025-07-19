-- Create table to track user roles and prevent duplicate roles per Google account
CREATE TABLE public.user_role_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('renter', 'owner')),
  google_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, role), -- Prevent same email from having multiple accounts with same role
  UNIQUE(google_id, role) -- Prevent same Google account from having multiple roles
);

-- Enable Row Level Security
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own role assignments" 
ON public.user_role_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role assignment" 
ON public.user_role_assignments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to check if a Google account already has a role
CREATE OR REPLACE FUNCTION public.check_google_account_role_conflict()
RETURNS TRIGGER AS $$
DECLARE
  existing_role TEXT;
  existing_google_id TEXT;
BEGIN
  -- Check if this Google ID already has a different role
  SELECT role, google_id INTO existing_role, existing_google_id
  FROM public.user_role_assignments 
  WHERE google_id = NEW.google_id AND role != NEW.role
  LIMIT 1;
  
  IF existing_role IS NOT NULL THEN
    RAISE EXCEPTION 'This Google account is already registered as a %. Please use a different Google account for % role.', existing_role, NEW.role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check role conflicts
CREATE TRIGGER check_role_conflict_trigger
  BEFORE INSERT ON public.user_role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_google_account_role_conflict();

-- Create function to handle automatic role assignment after signup
CREATE OR REPLACE FUNCTION public.handle_user_role_assignment()
RETURNS TRIGGER AS $$
DECLARE
  selected_role TEXT;
  google_sub TEXT;
BEGIN
  -- Get Google ID from user metadata
  google_sub := NEW.raw_user_meta_data ->> 'sub';
  
  -- Get selected role from user metadata (should be set during signup)
  selected_role := NEW.raw_user_meta_data ->> 'role';
  
  -- If no role is specified, default to 'renter'
  IF selected_role IS NULL THEN
    selected_role := 'renter';
  END IF;
  
  -- Insert role assignment
  INSERT INTO public.user_role_assignments (user_id, email, role, google_id)
  VALUES (NEW.id, NEW.email, selected_role, google_sub)
  ON CONFLICT (email, role) DO NOTHING; -- Don't error if already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign roles after user creation
CREATE TRIGGER on_auth_user_created_role_assignment
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_role_assignment();

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_role_assignments
  WHERE user_id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'renter');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;