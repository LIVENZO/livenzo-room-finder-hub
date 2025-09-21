import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { registerFCMToken, storePendingFCMToken, registerPendingFCMToken, clearPendingFCMToken } from '@/services/FCMService';

export const useFCMRegistration = () => {
  const { user } = useAuth();

  // Function to get and register FCM token with retry logic
  const getFCMTokenAndRegister = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      if ((window as any).Android && (window as any).Android.getFCMToken) {
        const token = (window as any).Android.getFCMToken();
        if (token && token.trim() !== '') {
          console.log('📱 FCM token retrieved from Android interface:', token.substring(0, 20) + '...');
          
          if (user) {
            // User is logged in, register immediately
            const success = await registerFCMToken(token);
            if (!success && retryCount < maxRetries) {
              console.log(`🔄 FCM registration failed, retrying... (${retryCount + 1}/${maxRetries})`);
              setTimeout(() => getFCMTokenAndRegister(retryCount + 1), 2000);
            }
          } else {
            // User not logged in yet, store temporarily
            storePendingFCMToken(token);
          }
        } else if (retryCount < maxRetries) {
          // No token yet, retry after delay
          console.log(`⏱️ No FCM token available yet, retrying... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => getFCMTokenAndRegister(retryCount + 1), 1000);
        }
      } else if (retryCount < maxRetries) {
        // Android interface not ready, retry
        console.log(`🤖 Android interface not ready, retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => getFCMTokenAndRegister(retryCount + 1), 500);
      }
    } catch (error) {
      console.error('💥 Error getting FCM token from Android:', error);
      if (retryCount < maxRetries) {
        setTimeout(() => getFCMTokenAndRegister(retryCount + 1), 1000);
      }
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
      console.log('👤 User logged in event detected, registering pending FCM token');
      // Small delay to ensure auth state is fully updated
      setTimeout(async () => {
        await registerPendingFCMToken();
        // Also try to get fresh token from Android
        await getFCMTokenAndRegister();
      }, 1500);
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
      console.log('👤 User is now available, checking for pending FCM token');
      registerPendingFCMToken();
      
      // Also try to get fresh token immediately when user becomes available
      setTimeout(() => {
        getFCMTokenAndRegister();
      }, 500);
    } else {
      // User logged out, clear any pending tokens
      clearPendingFCMToken();
    }
  }, [user, getFCMTokenAndRegister]);
};