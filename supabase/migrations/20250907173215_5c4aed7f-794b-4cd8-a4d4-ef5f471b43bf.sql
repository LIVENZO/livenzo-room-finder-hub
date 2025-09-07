-- Notifications setup migration
BEGIN;

-- Ensure pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add title to notices if missing
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS title text;

-- Ensure fcm_tokens uses gen_random_uuid()
ALTER TABLE public.fcm_tokens
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure RLS is enabled (idempotent if already enabled)
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Create trigger function for notices
CREATE OR REPLACE FUNCTION public.notify_send_push_for_notice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/send-push-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_secret', true) || '"}'::jsonb,
      body := jsonb_build_object('type','notice','record', row_to_json(NEW))::jsonb
    );
  RETURN NEW;
END;
$$;

-- Create trigger function for documents
CREATE OR REPLACE FUNCTION public.notify_send_push_for_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/send-push-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_secret', true) || '"}'::jsonb,
      body := jsonb_build_object('type','document','record', row_to_json(NEW))::jsonb
    );
  RETURN NEW;
END;
$$;

-- Create trigger function for complaints
CREATE OR REPLACE FUNCTION public.notify_send_push_for_complaint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/send-push-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_secret', true) || '"}'::jsonb,
      body := jsonb_build_object('type','complaint','record', row_to_json(NEW))::jsonb
    );
  RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS tr_notify_notice_insert ON public.notices;
CREATE TRIGGER tr_notify_notice_insert
AFTER INSERT ON public.notices
FOR EACH ROW EXECUTE FUNCTION public.notify_send_push_for_notice();

DROP TRIGGER IF EXISTS tr_notify_document_insert ON public.documents;
CREATE TRIGGER tr_notify_document_insert
AFTER INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.notify_send_push_for_document();

DROP TRIGGER IF EXISTS tr_notify_complaint_insert ON public.complaints;
CREATE TRIGGER tr_notify_complaint_insert
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.notify_send_push_for_complaint();

COMMIT;