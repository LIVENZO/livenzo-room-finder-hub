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
        switch (true) {
          case path === '/payments' || path === '/payment':
            console.log('💳 Opening payments page');
            this.navigate('/payments', { 
              state: { pendingPaymentId: data.payment_id },
              replace: true
            });
            break;
          case path === '/notices' || path === '/notice':
            console.log('📢 Opening notices page');
            const search = url.search || '';
            const noticeIdParam = url.searchParams?.get('id') || data.notice_id;
            this.navigate(`/notices${search}`, { 
              state: { noticeId: noticeIdParam },
              replace: true
            });
            break;
          case path.startsWith('/connections/'):
            console.log('👥 Opening renter detail page');
            const relationshipId = path.split('/connections/')[1];

            // Build query params so deep links work even on cold start without state
            const qp = new URLSearchParams();
            if (data.document_id) {
              qp.set('showDocuments', 'true');
              qp.set('documentId', String(data.document_id));
              if (data.renter_id) qp.set('renterId', String(data.renter_id));
            }
            if (data.complaint_id) {
              qp.set('showComplaints', 'true');
              qp.set('complaintId', String(data.complaint_id));
            }
            const target = qp.toString() ? `${path}?${qp.toString()}` : path;

            this.navigate(target, {
              state: {
                relationshipId,
                documentId: data.document_id,
                complaintId: data.complaint_id,
                openRenterDetail: true
              },
              replace: true
            });
            break;
          case path === '/connections':
            console.log('🤝 Opening connections page');
            const urlParams = url.searchParams;
            const state: any = {};
            
            // Check for tab parameter (for connection requests)
            const tabParam = urlParams?.get('tab');
            if (tabParam === 'requests') {
              console.log('🤝 Opening requests tab directly');
              state.defaultTab = 'requests';
            }
            
            if (urlParams?.get('showComplaints') === 'true') {
              console.log('⚠️ Highlighting complaints tab');
              state.highlightComplaint = urlParams.get('complaintId') || data.complaint_id;
              state.relationshipId = data.relationship_id;
            }
            
            if (urlParams?.get('showDocuments') === 'true') {
              console.log('📄 Highlighting documents tab');
              state.showDocuments = true;
              state.documentId = urlParams.get('documentId') || data.document_id;
              state.renterId = urlParams.get('renterId') || data.renter_id;
            }
            
            if (urlParams?.get('showRequests') === 'true') {
              console.log('🤝 Highlighting requests tab (legacy)');
              state.showRequests = true;
            }
            
            this.navigate('/connections', { 
              state,
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
      case 'rent_payment_due':
      case 'payment':
        console.log('💳 Payment notification - opening payments');
        this.navigate('/payments', {
          state: { pendingPaymentId: data.payment_id },
          replace: true,
        });
        break;
      case 'owner_notice':
      case 'notice':
        console.log('📢 Notice notification - opening notice page');
        const qs = data.notice_id ? `?id=${encodeURIComponent(String(data.notice_id))}` : '';
        this.navigate(`/notice${qs}`, {
          state: { noticeId: data.notice_id },
          replace: true,
        });
        break;
      case 'complaint':
      case 'complaint_update':
        console.log('⚠️ Complaint notification - opening connections');
        this.navigate('/connections', {
          state: {
            highlightComplaint: data.complaint_id,
            relationshipId: data.relationship_id,
          },
          replace: true,
        });
        break;
      case 'connection_request':
      case 'new_connection_request':
      case 'connection':
        console.log('🤝 Connection request - opening connections');
        this.navigate('/connections', {
          state: { showRequests: true },
          replace: true,
        });
        break;
      case 'document':
      case 'new_document':
      case 'document_uploaded':
        console.log('📄 Document notification - opening connections');
        this.navigate('/connections', {
          state: { 
            showDocuments: true,
            documentId: data.document_id,
            renterId: data.renter_id
          },
          replace: true,
        });
        break;
      case 'livenzo_announcement':
        console.log('📱 Livenzo announcement - opening dashboard');
        this.navigate('/dashboard', {
          state: { showAnnouncements: true },
          replace: true,
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