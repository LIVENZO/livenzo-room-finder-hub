import { useState, useCallback } from 'react';
import { securityService } from '@/services/security/securityService';
import { toast } from 'sonner';

interface SecurityValidationHook {
  isValidating: boolean;
  validateOperation: (
    operation: string,
    data?: Record<string, any>
  ) => Promise<boolean>;
  lastValidationResult: boolean | null;
}

export const useSecurityValidation = (): SecurityValidationHook => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState<boolean | null>(null);

  const validateOperation = useCallback(async (
    operation: string,
    data?: Record<string, any>
  ): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      const result = await securityService.performSecurityCheck(operation, undefined, data);
      
      setLastValidationResult(result.passed);
      
      if (!result.passed) {
        if (result.action === 'block') {
          toast.error(result.message || 'Security validation failed');
        } else if (result.action === 'warn') {
          toast.warning(result.message || 'Security warning');
        }
      }
      
      return result.passed;
    } catch (error) {
      console.error('Security validation error:', error);
      setLastValidationResult(false);
      toast.error('Security validation failed');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    isValidating,
    validateOperation,
    lastValidationResult
  };
};