import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { registerFCMToken } from '@/services/FCMService';

export const useFCMRegistration = () => {
  const { user } = useAuth();

  // Function to get and register FCM token
  const getFCMTokenAndRegister = useCallback(async () => {
    if (!user) return;
    
    try {
      if ((window as any).Android && (window as any).Android.getFCMToken) {
        const token = (window as any).Android.getFCMToken();
        if (token) {
          console.log('FCM token retrieved from Android interface:', token.substring(0, 20) + '...');
          await registerFCMToken(token);
        }
      }
    } catch (error) {
      console.error('Error getting FCM token from Android:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Immediately get and register token when user is available
    getFCMTokenAndRegister();

    // Listen for FCM token events from Android
    const handleFCMToken = async (event: CustomEvent) => {
      const token = event.detail;
      if (token) {
        console.log('FCM token received via event:', token.substring(0, 20) + '...');
        await registerFCMToken(token);
      }
    };

    const handleFCMTokenUpdate = async (event: CustomEvent) => {
      const token = event.detail;
      if (token) {
        console.log('FCM token updated via event:', token.substring(0, 20) + '...');
        await registerFCMToken(token);
      }
    };

    // Listen for user login events to re-register token
    const handleUserLoggedIn = async () => {
      console.log('User logged in event detected, registering FCM token');
      // Small delay to ensure auth state is fully updated
      setTimeout(getFCMTokenAndRegister, 1000);
    };

    // Add event listeners for Android WebView FCM events
    window.addEventListener('fcmTokenReady', handleFCMToken as EventListener);
    window.addEventListener('fcmTokenUpdated', handleFCMTokenUpdate as EventListener);
    window.addEventListener('userAlreadyLoggedIn', handleUserLoggedIn as EventListener);
    window.addEventListener('otpVerified', handleUserLoggedIn as EventListener);

    // Also try to get token after a delay to ensure Android interface is ready
    setTimeout(getFCMTokenAndRegister, 2000);

    return () => {
      window.removeEventListener('fcmTokenReady', handleFCMToken as EventListener);
      window.removeEventListener('fcmTokenUpdated', handleFCMTokenUpdate as EventListener);
      window.removeEventListener('userAlreadyLoggedIn', handleUserLoggedIn as EventListener);
      window.removeEventListener('otpVerified', handleUserLoggedIn as EventListener);
    };
  }, [user, getFCMTokenAndRegister]);
};