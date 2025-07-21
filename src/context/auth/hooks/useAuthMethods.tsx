
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { AUTH_CONFIG } from '@/config/auth';

export function useAuthMethods() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize Google Auth for native Capacitor
  const initializeGoogleAuth = async () => {
    console.log("Initializing Google Auth for Capacitor native platform");
    try {
      // For native Android, let the plugin use the configured androidClientId from capacitor.config.json
      await GoogleAuth.initialize({
        scopes: ['profile', 'email'],
      });
      console.log("Google Auth initialization complete");
    } catch (error) {
      console.error("Google Auth initialization failed:", error);
      throw error;
    }
  };

  const login = async (provider: string, selectedRole?: string) => {
    setIsLoading(true);
    
    try {
      if (provider === 'google') {
        console.log("Starting native Google authentication...");
        
        try {
          await initializeGoogleAuth();
          console.log("Google Auth initialized successfully");
          
          // Use native Capacitor GoogleAuth sign-in
          const result = await GoogleAuth.signIn();
          console.log("Google Sign-In result received:", {
            hasIdToken: !!result.authentication.idToken,
            hasAccessToken: !!result.authentication.accessToken,
            email: result.email
          });
          
          if (!result.authentication.idToken) {
            throw new Error('No ID token received from Google');
          }
          
          const idToken = result.authentication.idToken;
          const accessToken = result.authentication.accessToken;
          
          console.log("Signing in to Supabase with Google tokens...");
          
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
            console.log("Stored selected role:", selectedRole);
          }
          
          toast.success("Successfully signed in!");
          
        } catch (nativeError) {
          console.error("Capacitor Google Sign-In error:", nativeError);
          toast.error(`Google Sign-In failed: ${nativeError instanceof Error ? nativeError.message : 'Unknown error'}`);
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
      // Sign out from Capacitor Google Auth
      try {
        console.log("Signing out from Capacitor Google Auth");
        await GoogleAuth.signOut();
        console.log("Capacitor Google sign out successful");
      } catch (error) {
        console.log("Google native sign out error (non-critical):", error);
      }
      
      // Sign out from Supabase
      console.log("Signing out from Supabase");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        toast.error(`Error signing out: ${error.message}`);
      } else {
        localStorage.removeItem('userRole');
        localStorage.removeItem('selectedRole');
        console.log("Successfully signed out and cleared local storage");
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
