import { useCallback, useEffect, useState } from 'react';
import {
  fetchMyCollaborations,
  type Collaboration,
} from '@/services/collaborationService';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';

export const useCollaborations = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await fetchMyCollaborations();
      setCollaborations(list);
    } catch (e) {
      console.error('Failed to load collaborations', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: refresh on any change to property_collaborators
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('property_collaborators_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'property_collaborators' },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);

  return { collaborations, loading, refresh };
};
