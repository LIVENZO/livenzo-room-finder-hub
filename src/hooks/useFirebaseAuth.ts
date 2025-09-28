import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FirebaseAuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FirebaseAuthMethods {
  sendOTP: (phoneNumber: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
}

export const useFirebaseAuth = (): FirebaseAuthState & FirebaseAuthMethods => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Android interface is available
    if ((window as any).Android) {
      // Check if user is already logged in
      const loggedIn = (window as any).Android.isUserLoggedIn();
      setIsLoggedIn(loggedIn);
      
      // Listen for auth events from Android
      const handleOTPSent = (event: CustomEvent) => {
        console.log('OTP sent:', event.detail);
        setIsLoading(false);
        setError(null);
      };

      const handleOTPError = (event: CustomEvent) => {
        console.error('OTP error:', event.detail);
        setIsLoading(false);
        setError(event.detail);
      };

      const handleOTPVerified = async (event: CustomEvent) => {
        console.log('🎯 Firebase OTP verified successfully:', event.detail);
        
        try {
          setIsLoading(true);
          
          // Get Firebase ID token (this is what we need for proper OIDC flow)
          const firebaseIdToken = (window as any).Android.getIdToken();
          const firebaseUid = (window as any).Android.getCurrentUserUID();
          const phoneNumber = (window as any).Android.getCurrentUserPhone();
          const fcmToken = (window as any).Android.getFCMToken();
          
          console.log('🔑 Firebase authentication data:', { 
            hasIdToken: !!firebaseIdToken, 
            firebaseUid, 
            phoneNumber, 
            hasFcmToken: !!fcmToken 
          });
          
          if (!firebaseIdToken || !firebaseUid || !phoneNumber) {
            throw new Error('Missing required Firebase authentication data');
          }
          
          // Automatic token exchange with Supabase
          console.log('🔄 Initiating automatic token exchange with Supabase...');
          
          const response = await supabase.functions.invoke('sync-firebase-user', {
            body: {
              firebase_uid: firebaseUid,
              phone_number: phoneNumber,
              id_token: firebaseIdToken,
              fcm_token: fcmToken
            }
          });

          if (response.error) {
            console.error('❌ Token exchange failed:', response.error);
            throw new Error('Authentication failed. Please try again.');
          }

          const result = response.data;
          const session = result?.session;
          
          if (!session?.access_token || !session?.refresh_token) {
            console.error('❌ Invalid response from token exchange:', result);
            throw new Error('Authentication incomplete. Please try again.');
          }
          
          console.log('✅ Token exchange successful, establishing Supabase session...');
          
          // Automatically set the Supabase session
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          });
          
          if (sessionError) {
            console.error('❌ Failed to establish Supabase session:', sessionError);
            throw new Error('Failed to complete sign-in. Please try again.');
          }
          
          console.log('🎉 Authentication completed successfully! User ID:', sessionData?.session?.user?.id);
          
          // Clear any existing error states
          setError(null);
          setIsLoading(false);
          setIsLoggedIn(true);
          
          // The session will be automatically handled by the auth context
          // which will trigger navigation to dashboard
          
        } catch (error) {
          console.error('💥 Authentication flow error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          setError(errorMessage);
          setIsLoading(false);
          setIsLoggedIn(false);
        }
      };

      const handleOTPVerificationError = (event: CustomEvent) => {
        console.error('OTP verification error:', event.detail);
        setIsLoading(false);
        setError(event.detail);
      };

      const handleUserSignedOut = () => {
        console.log('User signed out');
        setIsLoggedIn(false);
        setError(null);
      };

      const handleUserAlreadyLoggedIn = async () => {
        console.log('🔄 User already logged in detected - syncing with Supabase...');
        
        try {
          setIsLoading(true);
          
          const firebaseIdToken = (window as any).Android.getIdToken();
          const firebaseUid = (window as any).Android.getCurrentUserUID();
          const phoneNumber = (window as any).Android.getCurrentUserPhone();
          const fcmToken = (window as any).Android.getFCMToken();
          
          if (firebaseIdToken && firebaseUid && phoneNumber) {
            console.log('🔄 Syncing existing user session with Supabase...');
            
            const response = await supabase.functions.invoke('sync-firebase-user', {
              body: {
                firebase_uid: firebaseUid,
                phone_number: phoneNumber,
                id_token: firebaseIdToken,
                fcm_token: fcmToken
              }
            });

            const session = response.data?.session;
            if (session?.access_token && session?.refresh_token) {
              console.log('✅ Establishing Supabase session for existing user...');
              
              const { error } = await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token
              });
              
              if (!error) {
                console.log('✅ Session synchronized successfully');
                setIsLoggedIn(true);
                setError(null);
              } else {
                console.error('❌ Failed to sync session:', error);
                setError('Failed to sync user session');
              }
            }
          }
        } catch (error) {
          console.error('💥 Error syncing existing user:', error);
          setError('Failed to sync user data');
        } finally {
          setIsLoading(false);
        }
      };

      // Add event listeners
      window.addEventListener('otpSent', handleOTPSent as EventListener);
      window.addEventListener('otpError', handleOTPError as EventListener);
      window.addEventListener('otpVerified', handleOTPVerified as EventListener);
      window.addEventListener('otpVerificationError', handleOTPVerificationError as EventListener);
      window.addEventListener('userSignedOut', handleUserSignedOut as EventListener);
      window.addEventListener('userAlreadyLoggedIn', handleUserAlreadyLoggedIn as EventListener);

      return () => {
        window.removeEventListener('otpSent', handleOTPSent as EventListener);
        window.removeEventListener('otpError', handleOTPError as EventListener);
        window.removeEventListener('otpVerified', handleOTPVerified as EventListener);
        window.removeEventListener('otpVerificationError', handleOTPVerificationError as EventListener);
        window.removeEventListener('userSignedOut', handleUserSignedOut as EventListener);
        window.removeEventListener('userAlreadyLoggedIn', handleUserAlreadyLoggedIn as EventListener);
      };
    }
  }, []);

  const sendOTP = async (phoneNumber: string): Promise<void> => {
    if (!(window as any).Android) {
      throw new Error('Android interface not available');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📱 Sending OTP to:', phoneNumber);
      (window as any).Android.sendOTP(phoneNumber);
      // The result will come through event listeners
    } catch (err) {
      console.error('❌ Failed to send OTP:', err);
      setIsLoading(false);
      setError('Failed to send OTP');
      throw err;
    }
  };

  const verifyOTP = async (otp: string): Promise<void> => {
    if (!(window as any).Android) {
      throw new Error('Android interface not available');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Verifying OTP...');
      (window as any).Android.verifyOTP(otp);
      // The result will come through event listeners and trigger automatic flow
    } catch (err) {
      console.error('❌ Failed to verify OTP:', err);
      setIsLoading(false);
      setError('Failed to verify OTP');
      throw err;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 Signing out user...');
      
      // Sign out from Supabase first
      await supabase.auth.signOut();
      
      // Then sign out from Firebase
      if ((window as any).Android) {
        (window as any).Android.signOut();
      }
      
      // Clear all local state
      setIsLoggedIn(false);
      setError(null);
      setIsLoading(false);
      
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      // Still clear local state even if there was an error
      setIsLoggedIn(false);
      setError(null);
      setIsLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  return {
    isLoggedIn,
    isLoading,
    error,
    sendOTP,
    verifyOTP,
    signOut,
    clearError,
  };
};