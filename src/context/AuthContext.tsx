
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (provider: string) => void;
  logout: () => void;
  session: Session | null;
  isGuestMode: boolean;
  enterAsGuest: () => void;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    console.log("AuthProvider initializing");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          // Get the user role from localStorage when signing in
          const storedRole = localStorage.getItem('userRole');
          setUserRole(storedRole);
          toast.success("Successfully signed in!");
          setIsGuestMode(false);
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null);
          toast.info("You've been signed out.");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession?.user?.email);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Check for stored role on initial load
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) {
        setUserRole(storedRole);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const enterAsGuest = () => {
    console.log("Entering as guest");
    setIsGuestMode(true);
    setIsLoading(false);
    
    // Get the user role from localStorage when entering as guest
    const storedRole = localStorage.getItem('userRole');
    setUserRole(storedRole);
    
    toast.info("You are browsing as a guest. Some features will be limited.");
  };

  const login = async (provider: string) => {
    setIsLoading(true);
    
    try {
      if (provider === 'google') {
        console.log("Starting Google authentication...");
        
        // Use window.location.origin for proper redirection
        const redirectUrl = `${window.location.origin}/dashboard`;
          
        console.log(`Redirect URL: ${redirectUrl}`);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          }
        });
        
        if (error) {
          console.error("Google auth error details:", error);
          toast.error(`Error signing in: ${error.message}`);
          setIsLoading(false);
        } else {
          console.log("Auth request successful:", data);
          // No need to do anything else, the redirect will happen automatically
        }
      } else {
        toast.error("Unsupported authentication provider");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isGuestMode) {
      setIsGuestMode(false);
      setUserRole(null);
      localStorage.removeItem('userRole');
      toast.info("You've exited guest mode.");
      return;
    }
    
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      toast.error(`Error signing out: ${error.message}`);
    }
    localStorage.removeItem('userRole');
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      login, 
      logout, 
      isGuestMode, 
      enterAsGuest, 
      userRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
