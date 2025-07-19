
import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { getStoredUserRoles, storeUserRole, getDefaultRole } from '../authUtils';
import { AUTH_CONFIG } from '@/config/auth';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [canChangeRole, setCanChangeRole] = useState<boolean>(true);
  
  // Derived properties
  const isOwner = userRole === 'owner';
  const currentUser = user;

  // Handle role setup for a user
  const setupUserRole = useCallback(async (currentUser: User) => {
    if (!currentUser.email || !AUTH_CONFIG.AUTH_ENABLED) return;
    
    try {
      // Fetch user role from database
      const { data: roleData, error } = await supabase
        .from('user_role_assignments')
        .select('role')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
        return;
      }

      if (roleData) {
        // User has a role in database
        setUserRole(roleData.role);
        localStorage.setItem('userRole', roleData.role);
        storeUserRole(currentUser.email, roleData.role);
        setCanChangeRole(false);
      } else {
        // No role found in database, this should not happen due to trigger
        // but handle gracefully
        const defaultRole = getDefaultRole();
        setUserRole(defaultRole);
        localStorage.setItem('userRole', defaultRole);
        setCanChangeRole(false);
      }
      
    } catch (error) {
      console.error('Error setting up user role:', error);
      const defaultRole = getDefaultRole();
      setUserRole(defaultRole);
      localStorage.setItem('userRole', defaultRole);
    }
  }, []);

  // Check for role conflicts before authentication
  const checkRoleConflict = async (googleId: string, selectedRole: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select('role')
        .eq('google_id', googleId)
        .neq('role', selectedRole);

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking role conflict:', error);
        return false;
      }

      if (data && data.length > 0) {
        const existingRole = data[0].role;
        toast.error(`This Google account is already registered as a ${existingRole}. Please use a different Google account for ${selectedRole} role.`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking role conflict:', error);
      return false;
    }
  };

  // Function to safely redirect to dashboard
  const redirectToDashboard = useCallback(() => {
    const currentPath = window.location.pathname;
    // Only redirect if we're on the landing page
    if (currentPath === '/' || currentPath === '/index.html') {
      console.log("Redirecting to dashboard...");
      
      // Use a small timeout to ensure all state is properly updated first
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 300);
    }
  }, []);

  // Handle auth state changes
  const handleAuthStateChange = useCallback((event: string, currentSession: Session | null) => {
    console.log("Auth state changed:", event, currentSession?.user?.email);
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Use setTimeout to handle async operation without making callback async
        setTimeout(async () => {
          await setupUserRole(currentSession.user);
          redirectToDashboard();
        }, 0);
      }
      
      // Show success message after a short delay to ensure UI is responsive
      if (event === 'SIGNED_IN') {
        setTimeout(() => {
          toast.success("Successfully signed in!");
        }, 500);
      }
    } else if (event === 'SIGNED_OUT') {
      setSession(null);
      setUser(null);
      setUserRole(null);
      setCanChangeRole(true);
      localStorage.removeItem('userRole');
      localStorage.removeItem('selectedRole');
      toast.info("You've been signed out.");
    }
    
    setIsLoading(false);
  }, [setupUserRole, redirectToDashboard]);

  // Check for existing session
  const checkExistingSession = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log("Initial session check:", currentSession?.user?.email || "No session found");
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Set up user role from database
        if (currentSession.user.email) {
          await setupUserRole(currentSession.user);
        }
        
        // Redirect to dashboard if we have a valid session
        redirectToDashboard();
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [redirectToDashboard, setupUserRole]);

  useEffect(() => {
    console.log("AuthProvider initializing");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // THEN check for existing session
    checkExistingSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange, checkExistingSession]);

  return {
    user,
    session,
    isLoading,
    userRole,
    isOwner,
    currentUser,
    canChangeRole,
    setUserRole,
    checkRoleConflict
  };
}
