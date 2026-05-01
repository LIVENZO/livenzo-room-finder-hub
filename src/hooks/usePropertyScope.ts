import { useMemo } from 'react';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';

/**
 * Convenience hook for owner-side queries that need to scope by the
 * currently-selected property.
 *
 * Returns:
 *   - propertyId:  active property id (or undefined while loading / if owner has none)
 *   - isPrimary:   whether the active property is the owner's primary one
 *                  (primary absorbs legacy rows that have property_id = NULL).
 */
export const usePropertyScope = () => {
  const { activeProperty } = useOwnerProperty();

  return useMemo(
    () => ({
      propertyId: activeProperty?.id,
      isPrimary: !!activeProperty?.is_primary,
      activeProperty,
    }),
    [activeProperty],
  );
};
