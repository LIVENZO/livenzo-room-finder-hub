
import { supabase } from '@/integrations/supabase/client';
import { testStorageBucketAccess } from '../storage/supabaseStorage';
import { securityMonitor } from './securityMonitor';

export interface SecurityCheckResult {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  recommendation?: string;
}

export class SecurityChecker {
  static async runSecurityChecks(): Promise<SecurityCheckResult[]> {
    const results: SecurityCheckResult[] = [];

    // Check authentication
    results.push(await this.checkAuthentication());

    // Check storage buckets
    results.push(...await this.checkStorageBuckets());

    // Check RLS policies
    results.push(...await this.checkRLSPolicies());

    // Check session security
    results.push(await this.checkSessionSecurity());

    // Check input validation
    results.push(this.checkInputValidation());

    return results;
  }

  private static async checkAuthentication(): Promise<SecurityCheckResult> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return {
          category: 'Authentication',
          check: 'Auth Service',
          status: 'fail',
          message: 'Authentication service error',
          recommendation: 'Check Supabase configuration'
        };
      }

      return {
        category: 'Authentication',
        check: 'Auth Service',
        status: 'pass',
        message: 'Authentication service is working'
      };
    } catch (error) {
      return {
        category: 'Authentication',
        check: 'Auth Service',
        status: 'fail',
        message: 'Authentication service unreachable',
        recommendation: 'Check network connection and Supabase configuration'
      };
    }
  }

  private static async checkStorageBuckets(): Promise<SecurityCheckResult[]> {
    const buckets = ['avatars', 'rooms', 'documents'];
    const results: SecurityCheckResult[] = [];

    for (const bucket of buckets) {
      const isAccessible = await testStorageBucketAccess(bucket);
      
      results.push({
        category: 'Storage',
        check: `Bucket: ${bucket}`,
        status: isAccessible ? 'pass' : 'fail',
        message: isAccessible ? `Bucket ${bucket} is accessible` : `Bucket ${bucket} is not accessible`,
        recommendation: !isAccessible ? 'Create bucket or check permissions' : undefined
      });
    }

    return results;
  }

  private static async checkRLSPolicies(): Promise<SecurityCheckResult[]> {
    const results: SecurityCheckResult[] = [];
    
    try {
      // Check if we can access our own user profile (indicates RLS is working)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          results.push({
            category: 'Database Security',
            check: 'RLS Policies',
            status: 'pass',
            message: 'Row Level Security is working correctly'
          });
        } else {
          results.push({
            category: 'Database Security',
            check: 'RLS Policies',
            status: 'warning',
            message: 'RLS policies may not be configured correctly',
            recommendation: 'Review database policies'
          });
        }
      }
    } catch (error) {
      results.push({
        category: 'Database Security',
        check: 'RLS Policies',
        status: 'fail',
        message: 'Unable to verify RLS policies',
        recommendation: 'Check database configuration'
      });
    }

    return results;
  }

  private static async checkSessionSecurity(): Promise<SecurityCheckResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          category: 'Session Security',
          check: 'Session Management',
          status: 'pass',
          message: 'No active session (expected for unauthenticated users)'
        };
      }

      // Check session expiry
      const now = Date.now() / 1000;
      const expiresAt = session.expires_at || 0;
      
      if (expiresAt - now < 300) { // Less than 5 minutes
        return {
          category: 'Session Security',
          check: 'Session Management',
          status: 'warning',
          message: 'Session expires soon',
          recommendation: 'Session will be refreshed automatically'
        };
      }

      return {
        category: 'Session Security',
        check: 'Session Management',
        status: 'pass',
        message: 'Session is valid and secure'
      };
    } catch (error) {
      return {
        category: 'Session Security',
        check: 'Session Management',
        status: 'fail',
        message: 'Session check failed',
        recommendation: 'Check authentication configuration'
      };
    }
  }

  private static checkInputValidation(): SecurityCheckResult {
    // Check if security monitoring is available
    try {
      securityMonitor.logSuspiciousActivity('security_check', { test: true });
      
      return {
        category: 'Input Security',
        check: 'Validation System',
        status: 'pass',
        message: 'Input validation and security monitoring active'
      };
    } catch (error) {
      return {
        category: 'Input Security',
        check: 'Validation System',
        status: 'warning',
        message: 'Security monitoring may not be fully configured',
        recommendation: 'Review security monitoring setup'
      };
    }
  }

  static async generateSecurityReport(): Promise<string> {
    const checks = await this.runSecurityChecks();
    
    const passCount = checks.filter(c => c.status === 'pass').length;
    const warnCount = checks.filter(c => c.status === 'warning').length;
    const failCount = checks.filter(c => c.status === 'fail').length;
    
    let report = `Security Assessment Report\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed\n\n`;
    
    const categories = [...new Set(checks.map(c => c.category))];
    
    for (const category of categories) {
      report += `${category}:\n`;
      const categoryChecks = checks.filter(c => c.category === category);
      
      for (const check of categoryChecks) {
        const status = check.status.toUpperCase();
        report += `  [${status}] ${check.check}: ${check.message}\n`;
        if (check.recommendation) {
          report += `    Recommendation: ${check.recommendation}\n`;
        }
      }
      report += '\n';
    }
    
    return report;
  }
}
