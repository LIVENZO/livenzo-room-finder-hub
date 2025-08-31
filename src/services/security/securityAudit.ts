import { supabase } from "@/integrations/supabase/client";

export interface SecurityAuditEvent {
  event_type: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityAuditService {
  private static instance: SecurityAuditService;

  static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  async logSecurityEvent(event: SecurityAuditEvent): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id || null,
        p_event_type: event.event_type,
        p_resource_type: event.resource_type || null,
        p_resource_id: event.resource_id || null,
        p_details: event.details || null,
        p_severity: event.severity
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Exception logging security event:', error);
    }
  }

  async logDataAccess(resourceType: string, resourceId: string | null, action: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'data_access',
      resource_type: resourceType,
      resource_id: resourceId as any,
      details: { action },
      severity: 'low'
    });
  }

  async logAuthFailure(reason: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'auth_failure',
      details: { reason },
      severity: 'medium'
    });
  }

  async logUnauthorizedAccess(resource: string, attempted_action: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'unauthorized_access',
      details: { resource, attempted_action },
      severity: 'high'
    });
  }

  async logSuspiciousActivity(activity: string, metadata: Record<string, any>): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'suspicious_activity',
      details: { activity, metadata },
      severity: 'high'
    });
  }
}

export const securityAudit = SecurityAuditService.getInstance();