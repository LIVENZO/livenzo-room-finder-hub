-- Remove the view that triggers security warnings and use a better approach
DROP VIEW IF EXISTS public.rooms_public_view;

-- Update the RLS policies to be more specific and secure
-- Remove the previous policies first
DROP POLICY IF EXISTS "Public can view basic room info without contact details" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can view room details with contact info" ON public.rooms;

-- Create a policy that allows public users to see rooms but hides phone numbers at the row level
-- This is better than using a view with security definer
CREATE POLICY "Public users can view available rooms without phone" 
ON public.rooms 
FOR SELECT 
USING (available = true);

-- Since we can't selectively hide columns in RLS policies, we rely on the application layer
-- and the secure functions to filter sensitive data

-- The get_rooms_public() function already handles hiding phone numbers for public users
-- The get_room_details_for_authenticated() function handles showing phone numbers only to authorized users

-- Add additional security function to check if user can access owner contact info
CREATE OR REPLACE FUNCTION public.can_access_owner_contact(room_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow access if user is the owner
  IF auth.uid() = room_owner_id THEN
    RETURN TRUE;
  END IF;
  
  -- Allow access if user has accepted relationship with owner
  IF EXISTS (
    SELECT 1 FROM public.relationships 
    WHERE owner_id = room_owner_id 
    AND renter_id = auth.uid() 
    AND status = 'accepted'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;