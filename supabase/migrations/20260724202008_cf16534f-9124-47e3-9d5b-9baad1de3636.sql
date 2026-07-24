
ALTER TABLE public.relationships
  ADD COLUMN IF NOT EXISTS disconnect_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS disconnect_auto_approve_at timestamptz,
  ADD COLUMN IF NOT EXISTS disconnect_requested_by uuid;

CREATE INDEX IF NOT EXISTS idx_relationships_disconnect_auto_approve
  ON public.relationships (disconnect_auto_approve_at)
  WHERE disconnect_auto_approve_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.auto_approve_disconnect_requests()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.relationships
  SET status = 'declined',
      disconnect_requested_at = NULL,
      disconnect_auto_approve_at = NULL,
      disconnect_requested_by = NULL,
      updated_at = now()
  WHERE status = 'accepted'
    AND disconnect_auto_approve_at IS NOT NULL
    AND disconnect_auto_approve_at <= now();
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-approve-disconnect-requests') THEN
    PERFORM cron.unschedule('auto-approve-disconnect-requests');
  END IF;
  PERFORM cron.schedule(
    'auto-approve-disconnect-requests',
    '0 * * * *',
    $cron$ SELECT public.auto_approve_disconnect_requests(); $cron$
  );
END $$;
