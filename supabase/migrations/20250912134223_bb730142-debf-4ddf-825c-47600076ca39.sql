-- Create edge function to handle Firebase authentication
-- This function will convert Firebase UID to Supabase user session

-- First, create a table to store Firebase UID mappings if needed
CREATE TABLE IF NOT EXISTS public.firebase_user_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  firebase_uid TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.firebase_user_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for firebase_user_mappings
CREATE POLICY "Users can view their own firebase mapping"
ON public.firebase_user_mappings
FOR SELECT
USING (supabase_user_id = auth.uid());

CREATE POLICY "Service role can manage firebase mappings"
ON public.firebase_user_mappings
FOR ALL
USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE TRIGGER update_firebase_user_mappings_updated_at
BEFORE UPDATE ON public.firebase_user_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();