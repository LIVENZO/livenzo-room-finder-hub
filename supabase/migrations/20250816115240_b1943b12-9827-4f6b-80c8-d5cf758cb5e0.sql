-- Add Razorpay merchant ID field to user profiles for owners
ALTER TABLE public.user_profiles 
ADD COLUMN razorpay_merchant_id TEXT;

-- Update the owner profile completion function to include razorpay_merchant_id
CREATE OR REPLACE FUNCTION public.check_owner_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.is_owner_profile_complete = (
    NEW.full_name IS NOT NULL AND 
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