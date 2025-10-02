-- Fix duplicate notifications and enforce single-source FCM pipeline
-- 1) Remove legacy webhook-based triggers/functions that call `send-notification`
-- 2) Ensure only one trigger per event, all pointing to `send-push-notification`
-- 3) Ensure connection request trigger exists for owners

-- =============================
-- STEP 1: Drop legacy triggers
-- =============================
-- Old triggers created in earlier migrations that call notify-* edge functions
DROP TRIGGER IF EXISTS notices_notification_trigger ON public.notices;
DROP TRIGGER IF EXISTS documents_notification_trigger ON public.documents;

-- Also drop alias names used in later migrations (idempotent)
DROP TRIGGER IF EXISTS trigger_notify_notice_webhook ON public.notices;
DROP TRIGGER IF EXISTS notify_notice_webhook_trigger ON public.notices;
DROP TRIGGER IF EXISTS trigger_notify_document_webhook ON public.documents;
DROP TRIGGER IF EXISTS notify_document_webhook_trigger ON public.documents;

-- Notifications table trigger (if any)
DROP TRIGGER IF EXISTS trigger_notify_send_notification ON public.notifications;

-- We intentionally keep chat message triggers as-is (not part of this fix scope)

-- ==================================
-- STEP 2: Drop legacy trigger functions
-- ==================================
DROP FUNCTION IF EXISTS public.notify_notice_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.notify_document_webhook() CASCADE;
DROP FUNCTION IF EXISTS public.notify_send_notification() CASCADE;
-- Keep public.notify_chat_message_webhook() (not in scope)

-- =================================================
-- STEP 3: Ensure only ONE trigger per event remains
-- =================================================
-- Recreate clean triggers that target the canonical function: send-push-notification

-- Notices
DROP TRIGGER IF EXISTS tr_notify_notice_insert ON public.notices;
CREATE TRIGGER tr_notify_notice_insert
AFTER INSERT ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.notify_send_push_for_notice();

-- Documents
DROP TRIGGER IF EXISTS tr_notify_document_insert ON public.documents;
CREATE TRIGGER tr_notify_document_insert
AFTER INSERT ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_send_push_for_document();

-- Complaints
DROP TRIGGER IF EXISTS tr_notify_complaint_insert ON public.complaints;
CREATE TRIGGER tr_notify_complaint_insert
AFTER INSERT ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.notify_send_push_for_complaint();

-- =====================================================
-- STEP 4: Ensure connection request notifications exist
-- =====================================================
-- Function already present in DB per project context, but ensure trigger exists
DROP TRIGGER IF EXISTS tr_notify_connection_request ON public.relationships;
CREATE TRIGGER tr_notify_connection_request
AFTER INSERT ON public.relationships
FOR EACH ROW
EXECUTE FUNCTION public.notify_send_push_for_connection_request();