
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

export function useAuthMethods() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (provider: string) => {
    setIsLoading(true);
    
    try {
      if (provider === 'google') {
        console.log("Starting Google authentication...");
        
        // Get the current origin and ensure it's correctly formatted
        const origin = window.location.origin;
        let redirectUrl = `${origin}/dashboard`;
        
        // If we're on the Lovable preview domain, ensure we're using the full URL
        if (origin.includes('lovable.app')) {
          redirectUrl = `${origin}/dashboard`;
        }
          
        console.log(`Redirect URL: ${redirectUrl}`);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            skipBrowserRedirect: false // Ensure browser redirection happens
          }
        });
        
        if (error) {
          console.error("Google auth error details:", error);
          toast.error(`Error signing in: ${error.message}`);
          setIsLoading(false);
        } else {
          console.log("Auth request successful, redirecting...", data);
          // No need to set loading to false as the page will redirect
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
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast.error(`Error signing out: ${error.message}`);
      } else {
        localStorage.removeItem('userRole');
        // Note: We don't remove userRoles mapping to preserve role association
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(`Error signing out: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Set loading to false here to ensure UI is updated even if there's an error
      setIsLoading(false);
    }
  };

  return { login, logout, isLoading, setIsLoading };
}
