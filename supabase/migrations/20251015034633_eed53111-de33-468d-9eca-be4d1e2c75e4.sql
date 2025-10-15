-- Add hostel_pg_name field to user_profiles table for owners
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS hostel_pg_name TEXT;

-- Update the check_owner_profile_completion function to use hostel_pg_name instead of full_name for owners
CREATE OR REPLACE FUNCTION public.check_owner_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For owners, check if hostel_pg_name is filled instead of full_name
  NEW.is_owner_profile_complete = (
    NEW.hostel_pg_name IS NOT NULL AND 
    NEW.phone IS NOT NULL AND
    NEW.accommodation_type IS NOT NULL AND
    NEW.property_name IS NOT NULL AND
    NEW.house_number IS NOT NULL AND
    NEW.total_rental_rooms IS NOT NULL AND
    NEW.resident_type IS NOT NULL AND
    NEW.property_location IS NOT NULL AND
    NEW.upi_phone_number IS NOT NULL AND
    NEW.razorpay_merchant_id IS NOT NULL
  );
  
  RETURN NEW;
END;
$function$;