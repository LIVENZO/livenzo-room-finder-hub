
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { AUTH_CONFIG } from '@/config/auth';

export function useAuthMethods() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize Google Auth for native platforms
  const initializeGoogleAuth = async () => {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.initialize({
        clientId: AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  };

  const login = async (provider: string, selectedRole?: string) => {
    setIsLoading(true);
    
    try {
      if (provider === 'google') {
        console.log("Starting native Google authentication...");
        
        let idToken: string;
        let accessToken: string;

        if (Capacitor.isNativePlatform()) {
          // Native authentication
          await initializeGoogleAuth();
          const result = await GoogleAuth.signIn();
          
          if (!result.authentication.idToken) {
            throw new Error('No ID token received from Google');
          }
          
          idToken = result.authentication.idToken;
          accessToken = result.authentication.accessToken;
          
          console.log("Native Google auth successful, signing in with Supabase...");
        } else {
          // Web fallback
          const origin = window.location.origin;
          const redirectUrl = `${origin}/dashboard`;
          
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            }
          });
          
          if (error) {
            throw error;
          }
          
          console.log("Web Google auth initiated...");
          return;
        }

        // Sign in to Supabase with the Google tokens
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          access_token: accessToken,
        });

        if (error) {
          console.error("Supabase auth error:", error);
          toast.error(`Error signing in: ${error.message}`);
          setIsLoading(false);
          return;
        }

        console.log("Successfully authenticated with Supabase");
        
        // Store the selected role if provided
        if (selectedRole && data.user?.email) {
          localStorage.setItem('selectedRole', selectedRole);
        }
        
        toast.success("Successfully signed in!");
        
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
      // Sign out from native Google Auth if available
      if (Capacitor.isNativePlatform()) {
        try {
          await GoogleAuth.signOut();
        } catch (error) {
          console.log("Google native sign out error (non-critical):", error);
        }
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast.error(`Error signing out: ${error.message}`);
      } else {
        localStorage.removeItem('userRole');
        localStorage.removeItem('selectedRole');
        toast.success("Successfully signed out");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(`Error signing out: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return { login, logout, isLoading, setIsLoading };
}
