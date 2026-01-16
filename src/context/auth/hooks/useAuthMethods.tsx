
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { FacebookLogin } from '@capacitor-community/facebook-login';
import { Capacitor } from '@capacitor/core';
import { AUTH_CONFIG } from '@/config/auth';
import { sendFirebaseOTP, verifyFirebaseOTP, clearConfirmationResult } from '@/config/firebase';

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
            
            // Sign in to Supabase with the Google tokens (using regular email/password flow)
            const { data, error } = await supabase.auth.signInWithPassword({
              email: result.email,
              password: 'google-oauth-temp-password', // This will be handled by admin creation
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

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase logout error:', error);
        // Continue with cleanup even if Supabase logout fails
      }
      
      // Clear local storage
      localStorage.removeItem('userRole');
      localStorage.removeItem('selectedRole');
      localStorage.removeItem('sb-naoqigivttgpkfwpzcgg-auth-token');
      
      // Sign out from native social providers if available
      try {
        if (Capacitor.isNativePlatform()) {
          await GoogleAuth.signOut();
        }
      } catch (error) {
        console.log('Native logout not available or failed:', error);
      }
      
      console.log('Logout completed successfully');
      
      // Force page reload to ensure clean state
      window.location.reload();
      
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPassword = async (email: string, password: string, selectedRole?: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('Supabase sign-in error:', error);
        toast.error(`Sign-in failed: ${error.message}`);
        throw error;
      } else {
        console.log('Sign-in successful:', data);
        
        // Store the selected role if provided
        if (selectedRole) {
          localStorage.setItem('selectedRole', selectedRole);
        }
        
        toast.success('Successfully signed in!');
      }
      
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithPassword = async (email: string, password: string, selectedRole?: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: selectedRole
          }
        }
      });

      if (error) {
        console.error('Supabase sign-up error:', error);
        toast.error(`Sign-up failed: ${error.message}`);
        throw error;
      } else {
        console.log('Sign-up successful:', data);
        
        // Store the selected role if provided
        if (selectedRole) {
          localStorage.setItem('selectedRole', selectedRole);
        }
        
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Account created! Please check your email to confirm your account.');
        } else {
          toast.success('Account created and signed in!');
        }
      }
      
    } catch (error) {
      console.error('Sign-up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (identifier: string): Promise<void> => {
    setIsLoading(true);
    try {
      await sendFirebaseOTP(identifier);
      toast.success('OTP sent successfully!');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (identifier: string, token: string): Promise<void> => {
    setIsLoading(true);
    try {
      const selectedRole = localStorage.getItem('selectedRole') || 'renter';

      // 1) Verify OTP with Firebase and get fresh ID token
      let idToken: string;
      let firebaseUid: string;
      let phoneNumber: string;
      try {
        const verifyRes = await verifyFirebaseOTP(token);
        idToken = verifyRes.idToken;
        firebaseUid = verifyRes.uid;
        phoneNumber = verifyRes.phoneNumber;
      } catch (e: any) {
        console.error('Firebase OTP verification failed:', e);
        clearConfirmationResult();
        toast.error('Invalid OTP, please try again.');
        throw e;
      }

      // 2) Exchange Firebase ID token for Supabase session via Edge Function
      // Include selected_role for role conflict checking
      const { data, error } = await supabase.functions.invoke('sync-firebase-user', {
        body: {
          firebase_uid: firebaseUid,
          phone_number: phoneNumber,
          fcm_token: null,
          selected_role: selectedRole,
        },
      });

      // Handle role conflict error specifically
      if (error) {
        console.error('Supabase session creation failed:', error);
        
        // Check if it's a role conflict error (status 409)
        if (error.message?.includes('role_conflict') || error.context?.status === 409) {
          try {
            const errorData = JSON.parse(error.message || '{}');
            if (errorData.error === 'role_conflict' && errorData.message) {
              toast.error(errorData.message, { duration: 6000 });
              throw new Error('role_conflict');
            }
          } catch (parseErr) {
            // If parsing fails, show a generic role conflict message
          }
        }
        
        toast.error('Unable to sign in, please try again later.');
        throw error;
      }

      // Check if response indicates role conflict
      if (data?.error === 'role_conflict') {
        toast.error(data.message, { duration: 6000 });
        throw new Error('role_conflict');
      }

      const { access_token, refresh_token } = data as { access_token: string; refresh_token: string };

      // 3) Set the session in Supabase so it persists across restarts
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessionError) {
        console.error('Setting Supabase session failed:', sessionError);
        toast.error('Unable to sign in, please try again later.');
        throw sessionError;
      }

      console.log('OTP verified and Supabase session created successfully');
      toast.success('Phone number verified successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  return { login, logout, signInWithPassword, signUpWithPassword, sendOTP, verifyOTP, isLoading, setIsLoading };
}
