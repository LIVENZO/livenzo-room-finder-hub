import { useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { registerFCMToken } from '@/services/FCMService';

export const useFCMRegistration = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

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

    // Add event listeners for Android WebView FCM events
    window.addEventListener('fcmTokenReady', handleFCMToken as EventListener);
    window.addEventListener('fcmTokenUpdated', handleFCMTokenUpdate as EventListener);

    // Also try to get token immediately if Android interface is available
    const tryGetTokenFromAndroid = async () => {
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
    };

    // Delay to ensure Android interface is ready
    setTimeout(tryGetTokenFromAndroid, 2000);

    return () => {
      window.removeEventListener('fcmTokenReady', handleFCMToken as EventListener);
      window.removeEventListener('fcmTokenUpdated', handleFCMTokenUpdate as EventListener);
    };
  }, [user]);
};