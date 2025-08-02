
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { FacebookLogin } from '@capacitor-community/facebook-login';
import { Capacitor } from '@capacitor/core';
import { AUTH_CONFIG } from '@/config/auth';

// Function to check for role conflicts before authentication
const checkRoleConflict = async (googleId: string | null, email: string | null, selectedRole: string): Promise<boolean> => {
  try {
    console.log("Pre-auth conflict check:", { googleId, email, selectedRole });
    
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
        // Check if we're on native platform or web
        const isNative = Capacitor.isNativePlatform();
        console.log("Platform detection - isNative:", isNative, "Platform:", Capacitor.getPlatform());
        
        if (isNative) {
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
            
            // Extract Google ID from ID token to check for role conflicts
            if (selectedRole) {
              try {
                const payload = JSON.parse(atob(idToken.split('.')[1]));
                const googleId = payload.sub;
                
                console.log("Checking for role conflicts for Google ID:", googleId, "with role:", selectedRole);
                
                // Check if this Google account already has a different role
                const hasConflict = await checkRoleConflict(googleId, result.email, selectedRole);
                if (hasConflict) {
                  setIsLoading(false);
                  return;
                }
              } catch (tokenError) {
                console.error("Error extracting Google ID from token:", tokenError);
                // Continue with authentication even if we can't check for conflicts
              }
            }
            
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
          // Web platform - use Supabase's built-in Google OAuth
          console.log("Starting web Google authentication...");
          
          // For web OAuth, we can't check conflicts before redirect
          // The role conflict check will happen in useAuthState after successful auth
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/`,
              queryParams: {
                role: selectedRole || 'renter'
              }
            }
          });

          if (error) {
            console.error("Web Google OAuth error:", error);
            toast.error(`Error signing in: ${error.message}`);
            setIsLoading(false);
            return;
          }

          // Store the selected role for web OAuth flow
          if (selectedRole) {
            localStorage.setItem('selectedRole', selectedRole);
            console.log("Stored selected role for web OAuth:", selectedRole);
          }
        }
        
      } else if (provider === 'facebook') {
        // Check if we're on native platform or web
        const isNative = Capacitor.isNativePlatform();
        console.log("Facebook auth - Platform detection - isNative:", isNative, "Platform:", Capacitor.getPlatform());
        
        if (isNative) {
          console.log("Starting native Facebook authentication...");
          
          try {
            // Initialize Facebook Login
            await FacebookLogin.initialize({ appId: 'YOUR_FACEBOOK_APP_ID' });
            
            // Use native Capacitor Facebook Login
            const result = await FacebookLogin.login({
              permissions: ['email', 'public_profile'],
            });
            
            console.log("Facebook Sign-In result received:", result);
            
            if (result.accessToken) {
              console.log("Signing in to Supabase with Facebook token...");
              
              // Sign in to Supabase with the Facebook token
              const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                  redirectTo: `${window.location.origin}/`,
                  queryParams: {
                    access_token: result.accessToken.token
                  }
                }
              });

              if (error) {
                console.error("Supabase Facebook auth error:", error);
                toast.error(`Error signing in: ${error.message}`);
                setIsLoading(false);
                return;
              }

              console.log("Successfully authenticated with Supabase via Facebook");
              
              // Store the selected role if provided
              if (selectedRole) {
                localStorage.setItem('selectedRole', selectedRole);
                console.log("Stored selected role:", selectedRole);
              }
              
              toast.success("Successfully signed in with Facebook!");
              
            } else {
              throw new Error('No access token received from Facebook');
            }
            
          } catch (nativeError) {
            console.error("Capacitor Facebook Sign-In error:", nativeError);
            toast.error(`Facebook Sign-In failed: ${nativeError instanceof Error ? nativeError.message : 'Unknown error'}`);
            setIsLoading(false);
            return;
          }
        } else {
          // Web platform - use Supabase's built-in Facebook OAuth
          console.log("Starting web Facebook authentication...");
          
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
              redirectTo: `${window.location.origin}/`,
              queryParams: {
                role: selectedRole || 'renter'
              }
            }
          });

          if (error) {
            console.error("Web Facebook OAuth error:", error);
            toast.error(`Error signing in: ${error.message}`);
            setIsLoading(false);
            return;
          }

          // Store the selected role for web OAuth flow
          if (selectedRole) {
            localStorage.setItem('selectedRole', selectedRole);
            console.log("Stored selected role for web Facebook OAuth:", selectedRole);
          }
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
      console.log("Starting logout process...");
      
      // Clear all localStorage data first
      localStorage.removeItem('userRole');
      localStorage.removeItem('selectedRole');
      localStorage.removeItem('sb-naoqigivttgpkfwpzcgg-auth-token');
      
      // Sign out from Capacitor Google Auth (non-critical)
      try {
        console.log("Signing out from Capacitor Google Auth");
        await GoogleAuth.signOut();
        console.log("Capacitor Google sign out successful");
      } catch (error) {
        console.log("Google native sign out error (non-critical):", error);
      }
      
      // Sign out from Capacitor Facebook Login (non-critical)
      try {
        console.log("Signing out from Capacitor Facebook Login");
        await FacebookLogin.logout();
        console.log("Capacitor Facebook sign out successful");
      } catch (error) {
        console.log("Facebook native sign out error (non-critical):", error);
      }
      
      // Sign out from Supabase (only if there's an active session)
      try {
        console.log("Checking Supabase session before logout");
        const { data: session } = await supabase.auth.getSession();
        
        if (session?.session) {
          console.log("Active Supabase session found, signing out...");
          const { error } = await supabase.auth.signOut();
          if (error && error.message !== 'sign out of session missing') {
            console.error("Supabase logout error:", error);
            throw error;
          }
        } else {
          console.log("No active Supabase session found");
        }
      } catch (error: any) {
        // Ignore "session missing" errors as they're expected for instant login
        if (error.message !== 'sign out of session missing') {
          console.error("Supabase logout error:", error);
          throw error;
        }
      }
      
      console.log("Successfully signed out and cleared all data");
      toast.success("Successfully signed out");
      
      // Force page reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(`Error signing out: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithInstantEmail = async (email: string, selectedRole?: string) => {
    setIsLoading(true);
    
    try {
      console.log("Starting instant email authentication for:", email);
      
      // Create instant user session without any verification
      const mockUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: email,
        user_metadata: {
          email: email,
          role: selectedRole,
          instant_signin: true
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };

      // Create mock session
      const mockSession = {
        access_token: `mock_token_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      };

      // Store in localStorage
      localStorage.setItem('sb-naoqigivttgpkfwpzcgg-auth-token', JSON.stringify({
        currentSession: mockSession,
        expiresAt: Date.now() + 3600000
      }));

      // Store the selected role
      if (selectedRole) {
        localStorage.setItem('selectedRole', selectedRole);
        localStorage.setItem('userRole', selectedRole);
      }

      console.log("Instant email login successful for:", email);
      toast.success(`Instantly signed in as ${email}`);
      
      setIsLoading(false);
      
      // Force page reload to trigger auth state update
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error("Instant email authentication error:", error);
      toast.error(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return { login, logout, loginWithMagicLink: loginWithInstantEmail, isLoading, setIsLoading };
}
