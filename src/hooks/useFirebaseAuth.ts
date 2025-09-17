import { useState, useEffect } from 'react';

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
          // Get Firebase user details
          const firebaseUid = (window as any).Android.getCurrentUserUID();
          const phoneNumber = (window as any).Android.getCurrentUserPhone();
          
          if (firebaseUid && phoneNumber) {
            console.log('Syncing Firebase user to Supabase:', { firebaseUid, phoneNumber });
            
            // Call the sync function
            const response = await fetch('https://naoqigivttgpkfwpzcgg.supabase.co/functions/v1/sync-firebase-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3FpZ2l2dHRncGtmd3B6Y2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTQwODIsImV4cCI6MjA2MDk3MDA4Mn0.dd6J5jxbWCRfs7z2C5idDu4z0J6ihnXCnK8d0g7noqw`
              },
              body: JSON.stringify({
                firebase_uid: firebaseUid,
                phone_number: phoneNumber,
                fcm_token: null // We'll handle FCM token separately
              })
            });

            const result = await response.json();
            
            if (result.success) {
              console.log('User synced successfully to Supabase:', result);
              setIsLoading(false);
              setError(null);
              setIsLoggedIn(true);
            } else {
              console.error('Failed to sync user to Supabase:', result);
              setError('Failed to sync user data');
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

      const handleUserAlreadyLoggedIn = () => {
        console.log('User already logged in detected');
        setIsLoggedIn(true);
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