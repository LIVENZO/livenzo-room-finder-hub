
-- Add public_id column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN public_id TEXT UNIQUE;

-- Create a function to generate random 10-character alphanumeric IDs
CREATE OR REPLACE FUNCTION generate_public_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
    random_char TEXT;
BEGIN
    -- Generate 10 random characters
    FOR i IN 1..10 LOOP
        random_char := substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        result := result || random_char;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to ensure unique public ID generation
CREATE OR REPLACE FUNCTION ensure_unique_public_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        new_id := generate_public_id();
        
        -- Check if this ID already exists
        SELECT EXISTS(
            SELECT 1 FROM public.user_profiles 
            WHERE public_id = new_id
        ) INTO id_exists;
        
        -- If ID doesn't exist, we can use it
        IF NOT id_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate public_id for new profiles
CREATE OR REPLACE FUNCTION auto_generate_public_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate public_id if it's not already set
    IF NEW.public_id IS NULL THEN
        NEW.public_id = ensure_unique_public_id();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate public_id on insert
CREATE TRIGGER trigger_auto_generate_public_id
    BEFORE INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_public_id();

-- Generate public_ids for existing users who don't have one
UPDATE public.user_profiles 
SET public_id = ensure_unique_public_id()
WHERE public_id IS NULL;
