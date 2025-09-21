import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { registerFCMToken, storePendingFCMToken, registerPendingFCMToken } from '@/services/FCMService';

export const useFCMRegistration = () => {
  const { user } = useAuth();

  // Function to get and register FCM token
  const getFCMTokenAndRegister = useCallback(async () => {
    try {
      if ((window as any).Android && (window as any).Android.getFCMToken) {
        const token = (window as any).Android.getFCMToken();
        if (token) {
          console.log('FCM token retrieved from Android interface:', token.substring(0, 20) + '...');
          
          if (user) {
            // User is logged in, register immediately
            await registerFCMToken(token);
          } else {
            // User not logged in yet, store temporarily
            storePendingFCMToken(token);
          }
        }
      }
    } catch (error) {
      console.error('Error getting FCM token from Android:', error);
    }
  }, [user]);

  useEffect(() => {
    // Always try to get FCM token, regardless of user login status
    getFCMTokenAndRegister();

    // Listen for FCM token events from Android
    const handleFCMToken = async (event: CustomEvent) => {
      const token = event.detail;
      if (token) {
        console.log('FCM token received via event:', token.substring(0, 20) + '...');
        
        if (user) {
          await registerFCMToken(token);
        } else {
          storePendingFCMToken(token);
        }
      }
    };

    const handleFCMTokenUpdate = async (event: CustomEvent) => {
      const token = event.detail;
      if (token) {
        console.log('FCM token updated via event:', token.substring(0, 20) + '...');
        
        if (user) {
          await registerFCMToken(token);
        } else {
          storePendingFCMToken(token);
        }
      }
    };

    // Listen for user login events to register pending tokens
    const handleUserLoggedIn = async () => {
      console.log('User logged in event detected, registering pending FCM token');
      // Small delay to ensure auth state is fully updated
      setTimeout(async () => {
        await registerPendingFCMToken();
        await getFCMTokenAndRegister();
      }, 1000);
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
  }, [getFCMTokenAndRegister]);

  // Separate effect to handle user login and register pending tokens
  useEffect(() => {
    if (user) {
      console.log('User is now available, checking for pending FCM token');
      registerPendingFCMToken();
    }
  }, [user]);
};