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

    console.log('Handling notification tap with data:', data);

    // Handle deep link URLs first
    if (data.deep_link_url) {
      try {
        const url = new URL(data.deep_link_url);
        const path = url.pathname;
        
        console.log('Navigating to deep link path:', path);
        
        // Map deep link paths to app routes
        switch (path) {
          case '/payment':
            this.navigate('/payments', { 
              state: { pendingPaymentId: data.payment_id } 
            });
            break;
          case '/notice':
            this.navigate('/notices', { 
              state: { noticeId: data.notice_id } 
            });
            break;
          case '/complaints':
            this.navigate('/connections', { 
              state: { 
                highlightComplaint: data.complaint_id,
                relationshipId: data.relationship_id 
              } 
            });
            break;
          case '/documents':
            this.navigate('/connections', { 
              state: { showDocuments: true } 
            });
            break;
          case '/connection-requests':
            this.navigate('/connections', { 
              state: { showRequests: true } 
            });
            break;
          default:
            // Navigate to the exact path if it matches our app routes
            this.navigate(path);
            break;
        }
        return;
      } catch (error) {
        console.error('Error parsing deep link URL:', error);
      }
    }

    // Fallback to type-based navigation
    switch (data.type) {
      case 'payment_delay':
        this.navigate('/payments', { 
          state: { pendingPaymentId: data.payment_id } 
        });
        break;
      case 'owner_notice':
        this.navigate('/notices', { 
          state: { noticeId: data.notice_id } 
        });
        break;
      case 'complaint':
        this.navigate('/connections', { 
          state: { 
            highlightComplaint: data.complaint_id,
            relationshipId: data.relationship_id 
          } 
        });
        break;
      case 'connection_request':
        this.navigate('/connections', { 
          state: { showRequests: true } 
        });
        break;
      case 'livenzo_announcement':
        this.navigate('/dashboard', { 
          state: { showAnnouncements: true } 
        });
        break;
      default:
        console.warn('Unknown notification type:', data.type);
        this.navigate('/dashboard');
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
    // Check if Android interface is available
    if (typeof window.Android !== 'undefined' && window.Android.getNotificationData) {
      try {
        const notificationDataString = window.Android.getNotificationData();
        if (notificationDataString) {
          const notificationData = JSON.parse(notificationDataString);
          console.log('Found Android startup notification data:', notificationData);
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            this.handleNotificationTap(notificationData);
          }, 500);
        }
      } catch (error) {
        console.error('Error checking Android startup notification:', error);
      }
    }

    // Check if iOS interface is available
    if (typeof window.iOS !== 'undefined' && window.iOS.getNotificationData) {
      try {
        const notificationDataString = window.iOS.getNotificationData();
        if (notificationDataString) {
          const notificationData = JSON.parse(notificationDataString);
          console.log('Found iOS startup notification data:', notificationData);
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            this.handleNotificationTap(notificationData);
          }, 500);
        }
      } catch (error) {
        console.error('Error checking iOS startup notification:', error);
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