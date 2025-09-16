import { useState } from 'react';
import { sendFirebaseOTP, verifyFirebaseOTP } from '@/config/firebase';
import { useFirebaseAuth } from '@/context/auth/FirebaseAuthProvider';
import { toast } from 'sonner';

export const useFirebaseAuthFlow = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { syncWithSupabase } = useFirebaseAuth();

  const sendOTP = async (phoneNumber: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure phone number has country code
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      await sendFirebaseOTP(formattedPhone);
      toast.success('OTP sent successfully!');
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      const errorMessage = err.message || 'Failed to send OTP';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (otp: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await verifyFirebaseOTP(otp);
      
      // The Firebase auth state change will automatically trigger syncWithSupabase
      toast.success('Phone number verified successfully!');
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      const errorMessage = err.message || 'Invalid OTP';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    sendOTP,
    verifyOTP,
    clearError,
    isLoading,
    error,
  };
};