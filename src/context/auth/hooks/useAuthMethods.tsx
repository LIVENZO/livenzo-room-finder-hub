
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
      console.log("Initializing Google Auth for native platform");
      await GoogleAuth.initialize({
        clientId: AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      console.log("Google Auth initialization complete");
    }
  };

  const login = async (provider: string, selectedRole?: string) => {
    setIsLoading(true);
    
    try {
      if (provider === 'google') {
        console.log("Starting native Google authentication...");
        
        // Always use native authentication on Capacitor platforms
        if (Capacitor.isNativePlatform()) {
          await initializeGoogleAuth();
          console.log("Google Auth initialized for native platform");
          
          const result = await GoogleAuth.signIn();
          console.log("Google Sign-In result:", result);
          
          if (!result.authentication.idToken) {
            throw new Error('No ID token received from Google');
          }
          
          const idToken = result.authentication.idToken;
          const accessToken = result.authentication.accessToken;
          
          console.log("Native Google auth successful, signing in with Supabase...");
          
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
          // For web development only - show message that native is required
          toast.error("Native Google Sign-In is required. Please use the mobile app.");
          setIsLoading(false);
          return;
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
