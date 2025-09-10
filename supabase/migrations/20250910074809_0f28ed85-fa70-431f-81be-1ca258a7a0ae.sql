-- 1) Add fcm_token column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS fcm_token text;

-- 2) Create or replace function to invoke the send-notification edge function on notifications insert
CREATE OR REPLACE FUNCTION public.notify_send_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call edge function for sending a push notification
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
      ),
      body := jsonb_build_object(
        'userId', NEW.user_id,
        'title', NEW.title,
        'body', NEW.message,
        'data', jsonb_build_object('notification_id', NEW.id, 'created_at', NEW.created_at)
      )
    );
  RETURN NEW;
END;
$$;

-- 3) Create trigger to run after insert on notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trigger_notify_send_notification'
  ) THEN
    CREATE TRIGGER trigger_notify_send_notification
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_send_notification();
  END IF;
END;
$$;