-- Enable RLS on the notifications table to fix security warning
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create appropriate RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

-- Only the system should be able to insert notifications, not users directly
-- So we don't create an INSERT policy for regular users