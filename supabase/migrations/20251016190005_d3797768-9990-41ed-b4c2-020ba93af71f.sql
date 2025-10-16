-- Create trigger function to notify owner when a document is uploaded
CREATE OR REPLACE FUNCTION public.notify_owner_document_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the edge function to send push notification
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/notify-document-uploaded',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
      ),
      body := jsonb_build_object(
        'type', 'document',
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$$;

-- Create trigger that fires after a new document is inserted
DROP TRIGGER IF EXISTS on_document_uploaded ON public.documents;
CREATE TRIGGER on_document_uploaded
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_owner_document_upload();