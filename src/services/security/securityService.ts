import { supabase } from '@/integrations/supabase/client';
import { securityMonitor } from './securityMonitor';
import { validateAuthentication } from './authValidator';
import { EnhancedValidator } from './enhancedValidation';
import { checkRateLimit } from './inputValidator';

export interface SecurityCheckResult {
  passed: boolean;
  message?: string;
  action?: 'warn' | 'block' | 'log';
}

class SecurityService {
  private static instance: SecurityService;

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Comprehensive security check for user operations
   */
  async performSecurityCheck(
    operation: string,
    userId?: string,
    data?: Record<string, any>
  ): Promise<SecurityCheckResult> {
    try {
      // 1. Authentication check
      const authResult = await validateAuthentication();
      if (!authResult.isValid) {
        return {
          passed: false,
          message: 'Authentication required',
          action: 'block'
        };
      }

      // 2. Rate limiting check
      const rateLimitKey = `${operation}_${authResult.userId}`;
      if (!checkRateLimit(rateLimitKey, 10, 60000)) { // 10 requests per minute
        await securityMonitor.logSuspiciousActivity('rate_limit_exceeded', {
          operation,
          userId: authResult.userId,
          timestamp: Date.now()
        });
        
        return {
          passed: false,
          message: 'Rate limit exceeded. Please slow down.',
          action: 'block'
        };
      }

      // 3. Input validation if data provided
      if (data) {
        const validationResult = this.validateOperationData(operation, data);
        if (!validationResult.passed) {
          return validationResult;
        }
      }

      // 4. User behavior monitoring
      if (authResult.userId) {
        await securityMonitor.monitorUserBehavior(authResult.userId, operation);
      }

      return { passed: true };
    } catch (error) {
      console.error('Security check failed:', error);
      await securityMonitor.logSecurityEvent({
        event_type: 'suspicious_activity',
        severity: 'high',
        details: {
          operation,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        passed: false,
        message: 'Security check failed',
        action: 'block'
      };
    }
  }

  /**
   * Validate data based on operation type
   */
  private validateOperationData(operation: string, data: Record<string, any>): SecurityCheckResult {
    switch (operation) {
      case 'room_creation':
        return this.validateRoomData(data);
      case 'profile_update':
        return this.validateProfileData(data);
      case 'complaint_submission':
        return this.validateComplaintData(data);
      case 'message_send':
        return this.validateMessageData(data);
      default:
        return { passed: true };
    }
  }

  private validateRoomData(data: Record<string, any>): SecurityCheckResult {
    const fields = ['title', 'description', 'location', 'price'];
    
    for (const field of fields) {
      if (data[field]) {
        let validationResult;
        
        if (field === 'price') {
          validationResult = EnhancedValidator.validatePrice(data[field].toString(), true);
        } else if (field === 'description') {
          validationResult = EnhancedValidator.validateDescription(data[field], true);
        } else {
          validationResult = EnhancedValidator.validateAndSanitize(data[field], 'safeName', {
            required: true,
            maxLength: field === 'location' ? 200 : 100
          });
        }
        
        if (validationResult.securityIssue) {
          securityMonitor.logSuspiciousActivity('data_validation_failure', {
            field,
            operation: 'room_creation',
            value: data[field]?.toString().substring(0, 50)
          });
          
          return {
            passed: false,
            message: `Invalid ${field} data detected`,
            action: 'block'
          };
        }
      }
    }
    
    return { passed: true };
  }

  private validateProfileData(data: Record<string, any>): SecurityCheckResult {
    if (data.full_name) {
      const nameResult = EnhancedValidator.validateName(data.full_name, true);
      if (nameResult.securityIssue) {
        return {
          passed: false,
          message: 'Invalid name format detected',
          action: 'block'
        };
      }
    }
    
    if (data.phone) {
      const phoneResult = EnhancedValidator.validatePhone(data.phone, true);
      if (phoneResult.securityIssue) {
        return {
          passed: false,
          message: 'Invalid phone format detected',
          action: 'block'
        };
      }
    }
    
    return { passed: true };
  }

  private validateComplaintData(data: Record<string, any>): SecurityCheckResult {
    const titleResult = EnhancedValidator.validateAndSanitize(data.title, 'safeName', {
      required: true,
      minLength: 5,
      maxLength: 100
    });
    
    if (titleResult.securityIssue) {
      return {
        passed: false,
        message: 'Invalid complaint title detected',
        action: 'block'
      };
    }
    
    const descResult = EnhancedValidator.validateDescription(data.description, true);
    if (descResult.securityIssue) {
      return {
        passed: false,
        message: 'Invalid complaint description detected',
        action: 'block'
      };
    }
    
    return { passed: true };
  }

  private validateMessageData(data: Record<string, any>): SecurityCheckResult {
    if (data.content) {
      const contentResult = EnhancedValidator.validateAndSanitize(data.content, 'safeDescription', {
        required: true,
        maxLength: 1000
      });
      
      if (contentResult.securityIssue) {
        return {
          passed: false,
          message: 'Invalid message content detected',
          action: 'block'
        };
      }
    }
    
    return { passed: true };
  }

  /**
   * Check if user has proper permissions for an operation
   */
  async checkUserPermissions(
    userId: string,
    operation: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      const { data: userRole } = await supabase
        .from('user_role_assignments')
        .select('role')
        .eq('user_id', userId)
        .single();

      // Basic permission checks based on operation and role
      switch (operation) {
        case 'room_management':
          return userRole?.role === 'owner';
        case 'complaint_submission':
          return userRole?.role === 'renter';
        case 'profile_update':
          return true; // All authenticated users can update their profile
        default:
          return true;
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Log security events for audit purposes
   */
  async logSecurityAudit(
    event: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await securityMonitor.logSecurityEvent({
      event_type: 'auth_failure',
      severity: 'medium',
      user_id: userId,
      details: {
        event,
        timestamp: new Date().toISOString(),
        ...details
      }
    });
  }
}

export const securityService = SecurityService.getInstance();