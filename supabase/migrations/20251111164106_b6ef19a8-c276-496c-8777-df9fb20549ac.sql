-- Function to update room availability when booking is accepted
CREATE OR REPLACE FUNCTION public.update_room_availability_on_booking_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Update the corresponding room to unavailable
    UPDATE public.rooms
    SET available = false
    WHERE id = NEW.room_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on booking_requests table
CREATE TRIGGER on_booking_accepted
AFTER UPDATE ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_room_availability_on_booking_acceptance();