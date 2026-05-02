import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { usePropertyScope } from '@/hooks/usePropertyScope';

/**
 * Returns the list of accepted, non-archived relationship IDs that belong to
 * the currently active property. Primary property absorbs legacy NULL rows.
 */
export const usePropertyRelationshipIds = () => {
  const { user } = useAuth();
  const { propertyId, isPrimary } = usePropertyScope();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from('relationships')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false);
      if (propertyId) {
        q = isPrimary
          ? q.or(`property_id.eq.${propertyId},property_id.is.null`)
          : q.eq('property_id', propertyId);
      }
      const { data } = await q;
      if (!cancelled) {
        setIds((data || []).map((r: any) => r.id));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, propertyId, isPrimary, refreshKey]);

  return { relationshipIds: ids, loading, refresh: () => setRefreshKey((k) => k + 1) };
};
