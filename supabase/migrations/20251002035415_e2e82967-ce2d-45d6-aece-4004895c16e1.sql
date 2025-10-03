
-- Fix Duplicate Notifications and Add Connection Request Notifications

-- ============================================
-- STEP 1: Drop ALL old webhook-based triggers
-- ============================================

-- Drop old webhook triggers for notices
DROP TRIGGER IF EXISTS trigger_notify_notice_webhook ON public.notices;
DROP TRIGGER IF EXISTS notify_notice_webhook_trigger ON public.notices;

-- Drop old webhook triggers for documents  
DROP TRIGGER IF EXISTS trigger_notify_document_webhook ON public.documents;
DROP TRIGGER IF EXISTS notify_document_webhook_trigger ON public.documents;

-- Drop old webhook triggers for complaints
DROP TRIGGER IF EXISTS trigger_notify_complaint_webhook ON public.complaints;

-- Drop old webhook triggers for chat messages
DROP TRIGGER IF EXISTS trigger_notify_chat_message ON public.chat_messages;
DROP TRIGGER IF EXISTS notify_chat_message_trigger ON public.chat_messages;

-- Drop the old notification trigger
DROP TRIGGER IF EXISTS trigger_notify_send_notification ON public.notifications;

-- ============================================
-- STEP 2: Drop old webhook functions (no longer needed)
-- ============================================

DROP FUNCTION IF EXISTS public.notify_notice_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.notify_document_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.notify_chat_message_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.notify_send_notification() CASCADE;

-- ============================================
-- STEP 3: Ensure only ONE trigger per event exists
-- ============================================

-- For NOTICES: Keep only tr_notify_notice_insert
DROP TRIGGER IF EXISTS tr_notify_notice_insert ON public.notices;
CREATE TRIGGER tr_notify_notice_insert
AFTER INSERT ON public.notices
FOR EACH ROW 
EXECUTE FUNCTION public.notify_send_push_for_notice();

-- For DOCUMENTS: Keep only tr_notify_document_insert
DROP TRIGGER IF EXISTS tr_notify_document_insert ON public.documents;
CREATE TRIGGER tr_notify_document_insert
AFTER INSERT ON public.documents
FOR EACH ROW 
EXECUTE FUNCTION public.notify_send_push_for_document();

-- For COMPLAINTS: Keep only tr_notify_complaint_insert
DROP TRIGGER IF EXISTS tr_notify_complaint_insert ON public.complaints;
CREATE TRIGGER tr_notify_complaint_insert
AFTER INSERT ON public.complaints
FOR EACH ROW 
EXECUTE FUNCTION public.notify_send_push_for_complaint();

-- ============================================
-- STEP 4: Add Connection Request Notifications
-- ============================================

-- Function to send notification for connection requests
CREATE OR REPLACE FUNCTION public.notify_send_push_for_connection_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only send notification for new pending requests (not accepted/rejected)
  IF NEW.status = 'pending' THEN
    PERFORM
      net.http_post(
        url := 'https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/send-push-notification',
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
$$;

-- Trigger for connection requests
DROP TRIGGER IF EXISTS tr_notify_connection_request ON public.relationships;
CREATE TRIGGER tr_notify_connection_request
AFTER INSERT ON public.relationships
FOR EACH ROW 
EXECUTE FUNCTION public.notify_send_push_for_connection_request();
