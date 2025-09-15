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

      const handleOTPVerified = (event: CustomEvent) => {
        console.log('OTP verified:', event.detail);
        setIsLoading(false);
        setError(null);
        setIsLoggedIn(true);
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