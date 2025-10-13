-- Fix duplicate notifications by cleaning up duplicate triggers
-- and updating notification messages with emojis

-- Step 1: Drop all duplicate triggers for notices
DO $$ 
BEGIN
  -- Drop all variations of notice triggers
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_notify_notice_insert') THEN
    DROP TRIGGER tr_notify_notice_insert ON public.notices;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_send_push_on_notice') THEN
    DROP TRIGGER tr_send_push_on_notice ON public.notices;
  END IF;
END $$;

-- Step 2: Drop all duplicate triggers for complaints
DO $$ 
BEGIN
  -- Drop all variations of complaint triggers
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_notify_complaint_insert') THEN
    DROP TRIGGER tr_notify_complaint_insert ON public.complaints;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_send_push_on_complaint') THEN
    DROP TRIGGER tr_send_push_on_complaint ON public.complaints;
  END IF;
END $$;

-- Step 3: Recreate the notice trigger function (only ONE trigger)
CREATE TRIGGER tr_notify_notice_created
AFTER INSERT ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.notify_send_push_for_notice();

-- Step 4: Recreate the complaint trigger function (only ONE trigger)
CREATE TRIGGER tr_notify_complaint_created
AFTER INSERT ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.notify_send_push_for_complaint();