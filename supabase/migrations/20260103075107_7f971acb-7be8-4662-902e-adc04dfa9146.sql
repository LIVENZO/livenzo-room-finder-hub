-- Create a trigger function to update referral status when first booking is completed
CREATE OR REPLACE FUNCTION public.update_referral_on_first_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  referral_record RECORD;
  booking_count INTEGER;
BEGIN
  -- Only proceed if the booking status changed to 'accepted' or 'completed'
  IF NEW.status IN ('accepted', 'completed') AND (OLD.status IS NULL OR OLD.status NOT IN ('accepted', 'completed')) THEN
    
    -- Check if this is the user's first successful booking
    SELECT COUNT(*) INTO booking_count
    FROM public.bookings
    WHERE user_id = NEW.user_id
      AND status IN ('accepted', 'completed')
      AND id != NEW.id;
    
    -- If this is their first booking
    IF booking_count = 0 THEN
      -- Find and update the pending referral for this user
      UPDATE public.referrals
      SET 
        status = 'completed',
        reward_credited_at = NOW(),
        updated_at = NOW()
      WHERE referred_id = NEW.user_id
        AND status IN ('pending', 'signed_up')
      RETURNING * INTO referral_record;
      
      IF FOUND THEN
        RAISE NOTICE 'Referral completed for user %', NEW.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on bookings table
DROP TRIGGER IF EXISTS trigger_update_referral_on_booking ON public.bookings;

CREATE TRIGGER trigger_update_referral_on_booking
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_on_first_booking();

-- Also create trigger for INSERT to catch new bookings that are immediately accepted
DROP TRIGGER IF EXISTS trigger_update_referral_on_new_booking ON public.bookings;

CREATE TRIGGER trigger_update_referral_on_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status IN ('accepted', 'completed'))
  EXECUTE FUNCTION public.update_referral_on_first_booking();