-- Disable the recursive notification trigger to prevent infinite loops
-- The send-notification edge function already handles FCM sending directly
DROP TRIGGER IF EXISTS trigger_notify_send_notification ON public.notifications;