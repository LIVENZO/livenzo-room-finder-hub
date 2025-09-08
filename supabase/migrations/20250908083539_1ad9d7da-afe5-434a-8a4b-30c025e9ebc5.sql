-- Create triggers to send FCM push notifications on inserts for notices, documents, and complaints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_send_push_on_notice'
  ) THEN
    CREATE TRIGGER tr_send_push_on_notice
    AFTER INSERT ON public.notices
    FOR EACH ROW EXECUTE FUNCTION public.notify_send_push_for_notice();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_send_push_on_document'
  ) THEN
    CREATE TRIGGER tr_send_push_on_document
    AFTER INSERT ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.notify_send_push_for_document();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_send_push_on_complaint'
  ) THEN
    CREATE TRIGGER tr_send_push_on_complaint
    AFTER INSERT ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.notify_send_push_for_complaint();
  END IF;
END $$;