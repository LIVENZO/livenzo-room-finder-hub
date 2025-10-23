-- Drop existing unique constraints on device_id if they exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_device' 
        AND conrelid = 'public.fcm_tokens'::regclass
    ) THEN
        ALTER TABLE public.fcm_tokens DROP CONSTRAINT unique_device;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fcm_tokens_device_id_key'
        AND conrelid = 'public.fcm_tokens'::regclass
    ) THEN
        ALTER TABLE public.fcm_tokens DROP CONSTRAINT fcm_tokens_device_id_key;
    END IF;
END $$;

-- Ensure device_id column exists (should already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fcm_tokens' 
        AND column_name = 'device_id'
    ) THEN
        ALTER TABLE public.fcm_tokens ADD COLUMN device_id TEXT;
    END IF;
END $$;

-- Populate NULL device_id values with gen_random_uuid()
UPDATE public.fcm_tokens 
SET device_id = gen_random_uuid()::text 
WHERE device_id IS NULL;

-- Make device_id NOT NULL now that all rows have values
ALTER TABLE public.fcm_tokens 
ALTER COLUMN device_id SET NOT NULL;

-- Add unique constraint on device_id
ALTER TABLE public.fcm_tokens 
ADD CONSTRAINT unique_device_id UNIQUE (device_id);

-- Ensure RLS is enabled
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow insert for logged in user" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Allow update for logged in user" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_insert_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_update_own" ON public.fcm_tokens;

-- Create the INSERT policy
CREATE POLICY "Allow insert for logged in user"
ON public.fcm_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create the UPDATE policy
CREATE POLICY "Allow update for logged in user"
ON public.fcm_tokens
FOR UPDATE
USING (auth.uid() = user_id);