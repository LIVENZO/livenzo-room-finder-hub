-- Create database triggers to call edge functions for notifications

-- Trigger for notices
CREATE OR REPLACE FUNCTION public.notify_notice_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function for notice notifications
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/notify-notice-created',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_secret', true) || '"}'::jsonb,
      body := json_build_object('record', row_to_json(NEW))::jsonb
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for documents
CREATE OR REPLACE FUNCTION public.notify_document_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function for document notifications
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/notify-document-uploaded',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_secret', true) || '"}'::jsonb,
      body := json_build_object('record', row_to_json(NEW))::jsonb
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for chat messages
CREATE OR REPLACE FUNCTION public.notify_chat_message_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function for chat message notifications
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/notify-chat-message',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_secret', true) || '"}'::jsonb,
      body := json_build_object('record', row_to_json(NEW))::jsonb
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS notices_notification_trigger ON public.notices;
CREATE TRIGGER notices_notification_trigger
  AFTER INSERT ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_notice_webhook();

DROP TRIGGER IF EXISTS documents_notification_trigger ON public.documents;
CREATE TRIGGER documents_notification_trigger
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_document_webhook();

DROP TRIGGER IF EXISTS chat_messages_notification_trigger ON public.chat_messages;
CREATE TRIGGER chat_messages_notification_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_message_webhook();