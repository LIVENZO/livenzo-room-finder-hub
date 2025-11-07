-- Create booking_requests table
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own booking requests
CREATE POLICY "Users can create their own booking requests"
ON public.booking_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own booking requests
CREATE POLICY "Users can view their own booking requests"
ON public.booking_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Room owners can view booking requests for their rooms
CREATE POLICY "Room owners can view booking requests"
ON public.booking_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE rooms.id = booking_requests.room_id
    AND rooms.owner_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_booking_requests_room_id ON public.booking_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_user_id ON public.booking_requests(user_id);