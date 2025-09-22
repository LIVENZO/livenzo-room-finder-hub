import { NavigateFunction } from 'react-router-dom';
import { setupCapacitorNotificationHandler } from '@/utils/capacitorNotificationHandler';

export interface NotificationData {
  type?: string;
  deep_link_url?: string;
  payment_id?: string;
  notice_id?: string;
  complaint_id?: string;
  relationship_id?: string;
  [key: string]: any;
}

export class NotificationNavigationService {
  private static navigate: NavigateFunction | null = null;

  static setNavigate(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  static handleNotificationTap(data: NotificationData) {
    if (!this.navigate) {
      console.warn('Navigation function not set');
      return;
    }

    console.log('🔔 Notification tapped - handling navigation with data:', data);

    // Handle deep link URLs first (primary method)
    if (data.deep_link_url) {
      try {
        const url = new URL(data.deep_link_url);
        const path = url.pathname;
        
        console.log('🚀 Navigating via deep link to path:', path);
        
        // Map deep link paths to app routes
        switch (path) {
          case '/payment':
            console.log('💳 Opening payments page');
            this.navigate('/payments', { 
              state: { pendingPaymentId: data.payment_id },
              replace: true // Replace current route for clean navigation
            });
            break;
          case '/notice':
            console.log('📢 Opening notices page');
            this.navigate('/notices', { 
              state: { noticeId: data.notice_id },
              replace: true
            });
            break;
          case '/complaints':
            console.log('⚠️ Opening complaints in connections');
            this.navigate('/connections', { 
              state: { 
                highlightComplaint: data.complaint_id,
                relationshipId: data.relationship_id 
              },
              replace: true
            });
            break;
          case '/documents':
            console.log('📄 Opening documents in connections');
            this.navigate('/connections', { 
              state: { showDocuments: true },
              replace: true
            });
            break;
          case '/connection-requests':
            console.log('🤝 Opening connection requests');
            this.navigate('/connections', { 
              state: { showRequests: true },
              replace: true
            });
            break;
          default:
            // Navigate to the exact path if it matches our app routes
            console.log('🔀 Default navigation to path:', path);
            this.navigate(path, { replace: true });
            break;
        }
        return;
      } catch (error) {
        console.error('❌ Error parsing deep link URL:', error);
      }
    }

    // Fallback to type-based navigation
    console.log('📱 Using type-based navigation fallback for type:', data.type);
    switch (data.type) {
      case 'payment_delay':
        console.log('💳 Payment delay notification - opening payments');
        this.navigate('/payments', { 
          state: { pendingPaymentId: data.payment_id },
          replace: true
        });
        break;
      case 'owner_notice':
        console.log('📢 Owner notice notification - opening notices');
        this.navigate('/notices', { 
          state: { noticeId: data.notice_id },
          replace: true
        });
        break;
      case 'complaint':
        console.log('⚠️ Complaint notification - opening connections');
        this.navigate('/connections', { 
          state: { 
            highlightComplaint: data.complaint_id,
            relationshipId: data.relationship_id 
          },
          replace: true
        });
        break;
      case 'connection_request':
        console.log('🤝 Connection request notification - opening connections');
        this.navigate('/connections', { 
          state: { showRequests: true },
          replace: true
        });
        break;
      case 'livenzo_announcement':
        console.log('📱 Livenzo announcement - opening dashboard');
        this.navigate('/dashboard', { 
          state: { showAnnouncements: true },
          replace: true
        });
        break;
      default:
        console.warn('❓ Unknown notification type:', data.type);
        console.log('🏠 Defaulting to dashboard');
        this.navigate('/dashboard', { replace: true });
        break;
    }
  }

  static initializeNotificationListener() {
    // Listen for notification tap events from Android/iOS
    window.addEventListener('notificationTapped', (event: any) => {
      const notificationData = event.detail;
      this.handleNotificationTap(notificationData);
    });

    // Setup Capacitor notification handling for iOS
    setupCapacitorNotificationHandler();

    // Check if app was opened via notification on startup
    this.checkForStartupNotification();
  }

  private static checkForStartupNotification() {
    console.log('🔍 Checking for startup notification data...');
    
    // Check if Android interface is available
    if (typeof window.Android !== 'undefined' && window.Android.getNotificationData) {
      try {
        const notificationDataString = window.Android.getNotificationData();
        if (notificationDataString) {
          const notificationData = JSON.parse(notificationDataString);
          console.log('📱 Found Android startup notification data:', notificationData);
          // Clear the notification data to prevent repeated handling
          if (window.Android.clearNotificationData) {
            window.Android.clearNotificationData();
          }
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            this.handleNotificationTap(notificationData);
          }, 800);
        } else {
          console.log('📱 No Android startup notification data');
        }
      } catch (error) {
        console.error('❌ Error checking Android startup notification:', error);
      }
    }

    // Check if iOS interface is available
    if (typeof window.iOS !== 'undefined' && window.iOS.getNotificationData) {
      try {
        const notificationDataString = window.iOS.getNotificationData();
        if (notificationDataString) {
          const notificationData = JSON.parse(notificationDataString);
          console.log('🍎 Found iOS startup notification data:', notificationData);
          // Clear the notification data to prevent repeated handling
          if (window.iOS.clearNotificationData) {
            window.iOS.clearNotificationData();
          }
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            this.handleNotificationTap(notificationData);
          }, 800);
        } else {
          console.log('🍎 No iOS startup notification data');
        }
      } catch (error) {
        console.error('❌ Error checking iOS startup notification:', error);
      }
    }
  }
}

// Extend window interface for Android and iOS bridges
declare global {
  interface Window {
    Android?: {
      getNotificationData?: () => string;
      clearNotificationData?: () => void;
      [key: string]: any;
    };
    iOS?: {
      getNotificationData?: () => string;
      clearNotificationData?: () => void;
      [key: string]: any;
    };
  }
}