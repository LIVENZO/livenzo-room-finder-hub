-- Make http_post header construction robust using jsonb_build_object to avoid invalid JSON casting
CREATE OR REPLACE FUNCTION public.notify_notice_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/notify-notice-created',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_send_push_for_notice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
      ),
      body := jsonb_build_object('type','notice','record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_send_push_for_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
      ),
      body := jsonb_build_object('type','document','record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_send_push_for_complaint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
      ),
      body := jsonb_build_object('type','complaint','record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$function$;