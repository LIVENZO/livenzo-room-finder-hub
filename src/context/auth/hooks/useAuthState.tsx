
import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { getStoredUserRoles, storeUserRole, getDefaultRole } from '../authUtils';

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
  const setupUserRole = useCallback((currentUser: User) => {
    if (!currentUser.email) return;
    
    const userEmail = currentUser.email;
    const userRolesMap = getStoredUserRoles();
    
    // If we have a stored role for this email
    if (userRolesMap[userEmail]) {
      const existingRole = userRolesMap[userEmail];
      setUserRole(existingRole);
      localStorage.setItem('userRole', existingRole);
      setCanChangeRole(false);
      
      // Inform the user if the selected role doesn't match their stored role
      const selectedRole = localStorage.getItem('selectedRole');
      if (selectedRole && selectedRole !== existingRole) {
        setTimeout(() => {
          toast.warning(`You previously signed in as a ${existingRole}. Role selection has been locked to ${existingRole}.`);
        }, 1000);
      }
    } else {
      // First time this user is signing in
      const selectedRole = localStorage.getItem('selectedRole') || 'renter';
      setUserRole(selectedRole);
      
      // Store this email with its role
      storeUserRole(userEmail, selectedRole);
      setCanChangeRole(false);
    }
  }, []);

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
        setupUserRole(currentSession.user);
        redirectToDashboard();
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
        
        // Check for stored roles
        if (currentSession.user.email) {
          const userRolesMap = getStoredUserRoles();
          
          if (userRolesMap[currentSession.user.email]) {
            // User has a role already
            const existingRole = userRolesMap[currentSession.user.email];
            setUserRole(existingRole);
            localStorage.setItem('userRole', existingRole);
            setCanChangeRole(false);
          } else {
            // Check for stored role on initial load
            const storedRole = localStorage.getItem('userRole');
            if (storedRole) {
              setUserRole(storedRole);
              setCanChangeRole(false);
              
              // Also save this to the user roles map
              storeUserRole(currentSession.user.email, storedRole);
            }
          }
        }
        
        // Redirect to dashboard if we have a valid session
        redirectToDashboard();
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [redirectToDashboard]);

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
    setUserRole
  };
}
