
-- Update notify_owner_document_upload to use custom domain
CREATE OR REPLACE FUNCTION public.notify_owner_document_upload()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://api.livenzo.site/functions/v1/notify-document-uploaded',
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
$function$;

-- Update notify_send_push_for_connection_request
CREATE OR REPLACE FUNCTION public.notify_send_push_for_connection_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM
      net.http_post(
        url := 'https://api.livenzo.site/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
        ),
        body := jsonb_build_object(
          'type', 'connection_request',
          'record', jsonb_build_object(
            'id', NEW.id,
            'owner_id', NEW.owner_id,
            'renter_id', NEW.renter_id,
            'status', NEW.status,
            'created_at', NEW.created_at
          )
        )
      );
  END IF;
  RETURN NEW;
END;
$function$;

-- Update notify_send_push_for_document
CREATE OR REPLACE FUNCTION public.notify_send_push_for_document()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://api.livenzo.site/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
      ),
      body := jsonb_build_object('type','document','record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$function$;

-- Update notify_send_push_for_complaint
CREATE OR REPLACE FUNCTION public.notify_send_push_for_complaint()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://api.livenzo.site/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
      ),
      body := jsonb_build_object('type','complaint','record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$function$;

-- Update notify_send_push_for_notice
CREATE OR REPLACE FUNCTION public.notify_send_push_for_notice()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://api.livenzo.site/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(current_setting('app.jwt_secret', true), '')
      ),
      body := jsonb_build_object('type','notice','record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$function$;

-- Update handle_new_notification
CREATE OR REPLACE FUNCTION public.handle_new_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://api.livenzo.site/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.jwt_secret', true)
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$function$;
