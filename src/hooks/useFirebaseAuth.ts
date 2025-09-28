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
        console.log('OTP verified:', event.detail);
        
        try {
          // Get Firebase user details and FCM token
          const firebaseUid = (window as any).Android.getCurrentUserUID();
          const phoneNumber = (window as any).Android.getCurrentUserPhone();
          const fcmToken = (window as any).Android.getFCMToken();
          
          if (firebaseUid && phoneNumber) {
            console.log('Syncing Firebase user to Supabase:', { firebaseUid, phoneNumber, hasFcmToken: !!fcmToken });
            
            // Call the sync function with FCM token using Supabase client
            const response = await supabase.functions.invoke('sync-firebase-user', {
              body: {
                firebase_uid: firebaseUid,
                phone_number: phoneNumber,
                fcm_token: fcmToken
              }
            });

            if (response.error) {
              console.error('Failed to sync user to Supabase:', response.error);
              setError('Failed to sync user data');
              setIsLoading(false);
              return;
            }

            const result = response.data;
            
            if (!response.error && result.access_token && result.refresh_token) {
              console.log('User synced successfully to Supabase:', result.user_id);
              try {
                const { data, error } = await supabase.auth.setSession({
                  access_token: result.access_token,
                  refresh_token: result.refresh_token
                });
                if (error) {
                  console.error('Failed to set Supabase session:', error);
                  setError('Failed to establish app session');
                  setIsLoading(false);
                  return;
                }
                console.log('Supabase session established:', data?.session?.user?.id);
                setIsLoading(false);
                setError(null);
                setIsLoggedIn(true);
              } catch (e) {
                console.error('Error setting Supabase session:', e);
                setError('Failed to establish app session');
                setIsLoading(false);
              }
            } else {
              console.error('Failed to sync user to Supabase:', result);
              setError(result.error || 'Failed to sync user data');
              setIsLoading(false);
            }
          } else {
            console.error('Could not get Firebase user details');
            setError('Failed to get user details');
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error syncing user to Supabase:', error);
          setError('Failed to sync user data');
          setIsLoading(false);
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
        console.log('User already logged in detected');
        setIsLoggedIn(true);
        
        // When user is already logged in, sync FCM token to Supabase
        try {
          const firebaseUid = (window as any).Android.getCurrentUserUID();
          const phoneNumber = (window as any).Android.getCurrentUserPhone();
          const fcmToken = (window as any).Android.getFCMToken();
          
          if (firebaseUid && phoneNumber && fcmToken) {
            console.log('Syncing FCM token for already logged in user');
            
            const response = await supabase.functions.invoke('sync-firebase-user', {
              body: {
                firebase_uid: firebaseUid,
                phone_number: phoneNumber,
                fcm_token: fcmToken
              }
            });

            if (response.data?.access_token && response.data?.refresh_token) {
              // Set session for already logged in user too
              const { error } = await supabase.auth.setSession({
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token
              });
              if (!error) {
                console.log('Session updated for already logged in user');
              }
            }
          }
        } catch (error) {
          console.error('Error syncing FCM token for logged in user:', error);
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
      (window as any).Android.sendOTP(phoneNumber);
      // The result will come through event listeners
    } catch (err) {
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
      (window as any).Android.verifyOTP(otp);
      // The result will come through event listeners
    } catch (err) {
      setIsLoading(false);
      setError('Failed to verify OTP');
      throw err;
    }
  };

  const signOut = (): void => {
    if ((window as any).Android) {
      (window as any).Android.signOut();
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