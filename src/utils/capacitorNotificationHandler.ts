import { Capacitor } from '@capacitor/core';

export const setupCapacitorNotificationHandler = () => {
  // Only run on mobile platforms
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // For iOS, we can use the App plugin to handle app state changes
  // and check for notification data when app becomes active
  if (Capacitor.getPlatform() === 'ios') {
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          // Check for notification data when app becomes active
          checkForNotificationData();
        }
      });

      // Also check immediately on setup
      checkForNotificationData();
    });
  }
};

const checkForNotificationData = () => {
  // For iOS, we would need to implement a native method similar to Android
  // For now, this is a placeholder that can be extended when iOS support is needed
  if (typeof window.iOS !== 'undefined' && window.iOS.getNotificationData) {
    try {
      const notificationDataString = window.iOS.getNotificationData();
      if (notificationDataString) {
        const notificationData = JSON.parse(notificationDataString);
        console.log('Found iOS notification data:', notificationData);
        // Dispatch the same event that Android uses
        window.dispatchEvent(new CustomEvent('notificationTapped', { 
          detail: notificationData 
        }));
      }
    } catch (error) {
      console.error('Error checking iOS notification data:', error);
    }
  }
};

// Extend window interface for iOS bridge (similar to Android)
declare global {
  interface Window {
    iOS?: {
      getNotificationData?: () => string;
      clearNotificationData?: () => void;
      [key: string]: any;
    };
  }
}