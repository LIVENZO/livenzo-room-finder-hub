
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SecurityEvent {
  event_type: 'auth_failure' | 'unauthorized_access' | 'suspicious_activity' | 'data_breach_attempt';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private eventQueue: SecurityEvent[] = [];
  private isProcessing = false;

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Add to queue for batch processing
    this.eventQueue.push(securityEvent);

    // Log to console for immediate visibility
    console.warn(`[SECURITY EVENT] ${event.event_type}:`, event.details);

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processEventQueue();
    }

    // Show user notification for high/critical events
    if (event.severity === 'high' || event.severity === 'critical') {
      toast.error('Security alert: Suspicious activity detected. Please contact support if this continues.');
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0 || this.isProcessing) return;

    this.isProcessing = true;
    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In a real application, you would send these to a security monitoring service
      // For now, we'll log them and store critical ones locally
      const criticalEvents = eventsToProcess.filter(e => e.severity === 'critical');
      
      if (criticalEvents.length > 0) {
        // Store critical events in localStorage for admin review
        const existingEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
        const updatedEvents = [...existingEvents, ...criticalEvents].slice(-100); // Keep last 100
        localStorage.setItem('security_events', JSON.stringify(updatedEvents));
      }

      console.log(`[SECURITY] Processed ${eventsToProcess.length} security events`);
    } catch (error) {
      console.error('[SECURITY] Failed to process security events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...eventsToProcess);
    } finally {
      this.isProcessing = false;
    }
  }

  async logAuthFailure(details: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'auth_failure',
      severity: 'medium',
      details: {
        action: 'authentication_failed',
        ...details
      }
    });
  }

  async logUnauthorizedAccess(resource: string, details: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'unauthorized_access',
      severity: 'high',
      details: {
        resource,
        action: 'unauthorized_access_attempt',
        ...details
      }
    });
  }

  async logSuspiciousActivity(activity: string, details: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'suspicious_activity',
      severity: 'medium',
      details: {
        activity,
        ...details
      }
    });
  }

  async logDataBreachAttempt(details: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'data_breach_attempt',
      severity: 'critical',
      details: {
        action: 'potential_data_breach',
        ...details
      }
    });
  }

  // Monitor for suspicious patterns
  async monitorUserBehavior(userId: string, action: string): Promise<void> {
    const key = `user_actions_${userId}`;
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    
    // Get recent actions
    const recentActions = JSON.parse(localStorage.getItem(key) || '[]')
      .filter((timestamp: number) => now - timestamp < timeWindow);
    
    recentActions.push(now);
    localStorage.setItem(key, JSON.stringify(recentActions));
    
    // Check for suspicious patterns
    if (recentActions.length > 50) { // More than 50 actions per minute
      await this.logSuspiciousActivity('high_frequency_requests', {
        user_id: userId,
        action,
        request_count: recentActions.length,
        time_window: '1_minute'
      });
    }
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
