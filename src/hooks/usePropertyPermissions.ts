import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';
import { fetchPropertyRole, type CollaboratorRole } from '@/services/collaborationService';

export type PropertyRole = 'owner' | CollaboratorRole | null;

/**
 * Returns the current user's role on the active property and a `canEdit` flag.
 *  - owner / manager  → canEdit = true
 *  - viewer           → canEdit = false (read-only)
 *  - null             → no access (treated as canEdit = false)
 */
export const usePropertyPermissions = () => {
  const { user } = useAuth();
  const { activeProperty } = useOwnerProperty();
  const [role, setRole] = useState<PropertyRole>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id || !activeProperty?.id) {
        setRole(null);
        return;
      }
      // Fast path: if I own the active property, skip RPC
      if (activeProperty.owner_id === user.id) {
        setRole('owner');
        return;
      }
      setLoading(true);
      const r = await fetchPropertyRole(activeProperty.id, user.id);
      if (!cancelled) {
        setRole(r);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, activeProperty?.id, activeProperty?.owner_id]);

  const canEdit = role === 'owner' || role === 'manager';
  const canView = role !== null;
  const isViewer = role === 'viewer';
  const isManager = role === 'manager';
  const isOwner = role === 'owner';

  return { role, loading, canEdit, canView, isViewer, isManager, isOwner };
};
