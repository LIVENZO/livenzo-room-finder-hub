import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

export interface OwnerProperty {
  id: string;
  owner_id: string;
  hostel_pg_name: string;
  accommodation_type: string | null;
  house_number: string | null;
  property_name: string | null;
  property_location: string | null;
  total_rental_rooms: number | null;
  resident_type: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  upi_id: string | null;
  upi_phone_number: string | null;
  razorpay_merchant_id: string | null;
  is_primary: boolean;
  is_active: boolean;
  public_id?: string | null;
}

interface OwnerPropertyContextValue {
  properties: OwnerProperty[];
  activeProperty: OwnerProperty | null;
  isLoading: boolean;
  setActivePropertyId: (id: string) => void;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'livenzo:activePropertyId';

const OwnerPropertyContext = createContext<OwnerPropertyContextValue | undefined>(undefined);

export const OwnerPropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchProperties = useCallback(async () => {
    if (!user || userRole !== 'owner') {
      setProperties([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_owner_properties');
      if (error) {
        console.error('Failed to load owner properties:', error);
        setProperties([]);
        return;
      }
      const list = (data || []) as OwnerProperty[];
      setProperties(list);

      // Pick a sensible active id
      setActiveId((current) => {
        if (current && list.some((p) => p.id === current)) return current;
        const primary = list.find((p) => p.is_primary) || list[0];
        return primary ? primary.id : null;
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Persist active id
  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(STORAGE_KEY, activeId);
    } catch {
      /* noop */
    }
  }, [activeId]);

  const setActivePropertyId = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const activeProperty = useMemo(
    () => properties.find((p) => p.id === activeId) || null,
    [properties, activeId],
  );

  const value = useMemo(
    () => ({
      properties,
      activeProperty,
      isLoading,
      setActivePropertyId,
      refresh: fetchProperties,
    }),
    [properties, activeProperty, isLoading, setActivePropertyId, fetchProperties],
  );

  return <OwnerPropertyContext.Provider value={value}>{children}</OwnerPropertyContext.Provider>;
};

export const useOwnerProperty = (): OwnerPropertyContextValue => {
  const ctx = useContext(OwnerPropertyContext);
  if (!ctx) {
    // Safe fallback so non-owner pages can call this without crashing
    return {
      properties: [],
      activeProperty: null,
      isLoading: false,
      setActivePropertyId: () => {},
      refresh: async () => {},
    };
  }
  return ctx;
};
