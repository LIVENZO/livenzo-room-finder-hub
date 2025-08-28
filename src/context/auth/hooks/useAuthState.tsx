
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
    if ((!currentUser.email && !currentUser.phone) || !AUTH_CONFIG.AUTH_ENABLED) return;
    
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
        storeUserRole(currentUser.email || currentUser.phone, roleData.role);
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

  // Ensure user has a role assignment (for both OAuth and phone/email flows)
  const ensureUserRoleAssignment = useCallback(async (user: User, selectedRole: string) => {
    try {
      const googleId = user.user_metadata?.sub || user.user_metadata?.provider_id;
      const userEmail = user.email || user.phone; // Use phone as fallback if no email
      
      console.log("Ensuring role assignment for user:", userEmail, "role:", selectedRole, "auth method:", user.app_metadata?.provider);
      
      // Check if user already has a role assignment
      const { data: existingRole, error } = await supabase
        .from('user_role_assignments')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No role assignment found, create one
        console.log("Creating role assignment for user:", userEmail, "role:", selectedRole);
        
        const { error: insertError } = await supabase
          .from('user_role_assignments')
          .insert({
            user_id: user.id,
            email: userEmail, // This will handle both email and phone users
            role: selectedRole,
            google_id: googleId // This will be null for phone auth, which is fine
          });

        if (insertError) {
          console.error('Error creating role assignment:', insertError);
        } else {
          console.log("Successfully created role assignment for", selectedRole);
        }
      } else if (existingRole) {
        console.log("User already has role assignment:", existingRole.role);
      }
    } catch (error) {
      console.error('Error ensuring user role assignment:', error);
    }
  }, []);

  // Check for role conflicts after authentication (mainly for web OAuth flow)
  const checkRoleConflict = async (user: User, selectedRole: string): Promise<boolean> => {
    try {
      const googleId = user.user_metadata?.sub || user.user_metadata?.provider_id;
      const email = user.email;
      
      console.log("Checking role conflict for:", { email, googleId, selectedRole, userMetadata: user.user_metadata });

      // Check by google_id first if available
      if (googleId) {
        console.log("Checking role conflict by Google ID:", googleId);
        const { data: googleData, error: googleError } = await supabase
          .from('user_role_assignments')
          .select('role, email')
          .eq('google_id', googleId)
          .neq('role', selectedRole);

        console.log("Google ID check result:", { googleData, googleError });

        if (googleError && googleError.code !== 'PGRST116') {
          console.error('Error checking Google ID role conflict:', googleError);
        } else if (googleData && googleData.length > 0) {
          const existingRole = googleData[0].role;
          console.log("Role conflict detected by Google ID:", existingRole);
          toast.error(`This Google account is already registered as a ${existingRole}. Please use a different Google account for ${selectedRole} role.`);
          return true;
        }
      }

      // Also check by email as fallback
      if (email) {
        console.log("Checking role conflict by email:", email);
        const { data: emailData, error: emailError } = await supabase
          .from('user_role_assignments')
          .select('role, google_id')
          .eq('email', email)
          .neq('role', selectedRole);

        console.log("Email check result:", { emailData, emailError });

        if (emailError && emailError.code !== 'PGRST116') {
          console.error('Error checking email role conflict:', emailError);
        } else if (emailData && emailData.length > 0) {
          const existingRole = emailData[0].role;
          console.log("Role conflict detected by email:", existingRole);
          toast.error(`This Google account is already registered as a ${existingRole}. Please use a different Google account for ${selectedRole} role.`);
          return true;
        }
      }

      console.log("No role conflict detected");
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
          // Check for role conflicts (especially important for web OAuth flow)
          const selectedRole = localStorage.getItem('selectedRole') || 'renter';
          console.log("Checking role conflicts - selectedRole:", selectedRole, "user:", currentSession.user.email);
          
          const hasConflict = await checkRoleConflict(currentSession.user, selectedRole);
          if (hasConflict) {
            // Sign out the user if there's a role conflict
            console.log("Role conflict detected, signing out user");
            await supabase.auth.signOut();
            localStorage.removeItem('selectedRole');
            return;
          }
          
          // Ensure the user has a role assignment
          await ensureUserRoleAssignment(currentSession.user, selectedRole);
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
        if (currentSession.user.email || currentSession.user.phone) {
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
    checkRoleConflict: (user: User, selectedRole: string) => checkRoleConflict(user, selectedRole),
    ensureUserRoleAssignment
  };
}
