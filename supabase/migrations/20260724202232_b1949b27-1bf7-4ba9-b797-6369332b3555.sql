
DROP FUNCTION IF EXISTS public.get_active_renter_relationships(uuid);

CREATE OR REPLACE FUNCTION public.get_active_renter_relationships(renter_user_id uuid)
 RETURNS TABLE(id uuid, owner_id uuid, renter_id uuid, status text, chat_room_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, archived boolean, disconnect_requested_at timestamp with time zone, disconnect_auto_approve_at timestamp with time zone, disconnect_requested_by uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT r.id, r.owner_id, r.renter_id, r.status, r.chat_room_id, r.created_at, r.updated_at, r.archived,
         r.disconnect_requested_at, r.disconnect_auto_approve_at, r.disconnect_requested_by
  FROM public.relationships r
  WHERE r.renter_id = renter_user_id 
    AND r.archived = FALSE
  ORDER BY r.created_at DESC;
END;
$function$;
