import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  sendFirebaseOTP, 
  verifyFirebaseOTP, 
  clearConfirmationResult 
} from '@/config/firebase';

export interface ExternalFirebaseAuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ExternalFirebaseAuthMethods {
  sendOTP: (phoneNumber: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useExternalFirebaseAuth = (): ExternalFirebaseAuthState & ExternalFirebaseAuthMethods => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
        if (event === 'SIGNED_OUT') {
          clearConfirmationResult();
          setCurrentPhoneNumber(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const sendOTP = async (phoneNumber: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setCurrentPhoneNumber(phoneNumber);
    
    try {
      await sendFirebaseOTP(phoneNumber);
      console.log('OTP sent successfully to:', phoneNumber);
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send OTP');
      setCurrentPhoneNumber(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (otp: string): Promise<void> => {
    if (!currentPhoneNumber) {
      setError('No phone number found. Please send OTP first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Verify OTP with Firebase and get ID token
      console.log('Verifying OTP with Firebase...');
      const firebaseResult = await verifyFirebaseOTP(otp);
      
      if (!firebaseResult?.idToken) {
        throw new Error('Firebase verification failed - no ID token received');
      }

      // Step 2: Use the ID token directly from Firebase verification
      console.log('Using Firebase ID token...');
      const idToken = firebaseResult.idToken;
      
      if (!idToken) {
        throw new Error('Failed to get Firebase ID token');
      }

      // Step 3: Exchange Firebase token for Supabase tokens via your backend
      console.log('Exchanging Firebase token for Supabase tokens...');
      const response = await fetch('https://firebase-bridge.onrender.com/auth/firebase-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseIdToken: idToken,
          phoneNumber: currentPhoneNumber
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `Backend error: ${response.status}`);
      }

      const backendResult = await response.json();
      
      if (!backendResult.access_token || !backendResult.refresh_token) {
        throw new Error('Invalid response from backend - missing tokens');
      }

      // Step 4: Set Supabase session with the returned tokens
      console.log('Setting Supabase session...');
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: backendResult.access_token,
        refresh_token: backendResult.refresh_token
      });

      if (sessionError) {
        console.error('Failed to set Supabase session:', sessionError);
        throw new Error('Failed to establish session: ' + sessionError.message);
      }

      if (!data.session) {
        throw new Error('Session was not created successfully');
      }

      console.log('Authentication successful! User ID:', data.session.user.id);
      setIsLoggedIn(true);
      
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(err.message || 'OTP verification failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear Firebase confirmation result
      clearConfirmationResult();
      
      setIsLoggedIn(false);
      setCurrentPhoneNumber(null);
      setError(null);
      
      console.log('User signed out successfully');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
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