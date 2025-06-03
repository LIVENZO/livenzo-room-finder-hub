
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthValidationResult {
  isValid: boolean;
  userId?: string;
  error?: string;
}

/**
 * Validates current user authentication status
 */
export const validateAuthentication = async (): Promise<AuthValidationResult> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Authentication validation error:', error);
      return { isValid: false, error: 'Authentication check failed' };
    }
    
    if (!session || !session.user) {
      return { isValid: false, error: 'User not authenticated' };
    }
    
    return { isValid: true, userId: session.user.id };
  } catch (error) {
    console.error('Exception during authentication validation:', error);
    return { isValid: false, error: 'Authentication validation failed' };
  }
};

/**
 * Validates that the current user matches the expected user ID
 */
export const validateUserAuthorization = async (expectedUserId: string): Promise<boolean> => {
  const authResult = await validateAuthentication();
  
  if (!authResult.isValid) {
    toast.error('Authentication required');
    return false;
  }
  
  if (authResult.userId !== expectedUserId) {
    toast.error('Unauthorized access');
    return false;
  }
  
  return true;
};

/**
 * Higher-order function to wrap service functions with authentication
 */
export const withAuth = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | null> => {
    const authResult = await validateAuthentication();
    
    if (!authResult.isValid) {
      toast.error('Please log in to continue');
      throw new Error('Authentication required');
    }
    
    return fn(...args);
  };
};
