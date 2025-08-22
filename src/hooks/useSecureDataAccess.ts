import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { securityAudit } from '@/services/security/securityAudit';
import { toast } from 'sonner';

interface SecureDataAccessHook {
  loading: boolean;
  fetchSecureData: <T>(
    query: () => Promise<{ data: T | null; error: any }>,
    resourceType: string,
    resourceId?: string
  ) => Promise<T | null>;
}

export const useSecureDataAccess = (): SecureDataAccessHook => {
  const [loading, setLoading] = useState(false);

  const fetchSecureData = useCallback(async <T>(
    query: () => Promise<{ data: T | null; error: any }>,
    resourceType: string,
    resourceId?: string
  ): Promise<T | null> => {
    setLoading(true);
    
    try {
      // Check if user is authenticated for sensitive operations
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user && ['user_profiles', 'relationships', 'payments'].includes(resourceType)) {
        await securityAudit.logUnauthorizedAccess(resourceType, 'fetch');
        toast.error('Authentication required');
        return null;
      }

      // Execute the query
      const { data, error } = await query();

      if (error) {
        console.error(`Error fetching ${resourceType}:`, error);
        
        // Log potential security issues
        if (error.message?.includes('RLS') || error.message?.includes('permission')) {
          await securityAudit.logUnauthorizedAccess(resourceType, 'fetch');
        }
        
        toast.error('Access denied or data not found');
        return null;
      }

      // Log successful data access
      if (resourceId) {
        await securityAudit.logDataAccess(resourceType, resourceId, 'fetch');
      }

      return data;
    } catch (error) {
      console.error('Exception in secure data access:', error);
      toast.error('An error occurred while accessing data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, fetchSecureData };
};