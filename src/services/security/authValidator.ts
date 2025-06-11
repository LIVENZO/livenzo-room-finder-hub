
import { supabase } from '@/integrations/supabase/client';

export interface AuthValidationResult {
  isValid: boolean;
  userId?: string;
  error?: string;
}

/**
 * Validate user authentication status
 */
export const validateAuthentication = async (): Promise<AuthValidationResult> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth validation error:', error);
      return {
        isValid: false,
        error: 'Authentication error occurred'
      };
    }
    
    if (!session || !session.user) {
      return {
        isValid: false,
        error: 'User not authenticated'
      };
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      return {
        isValid: false,
        error: 'Session expired'
      };
    }
    
    return {
      isValid: true,
      userId: session.user.id
    };
  } catch (error) {
    console.error('Authentication validation failed:', error);
    return {
      isValid: false,
      error: 'Authentication validation failed'
    };
  }
};

/**
 * Validate user has permission for a specific action
 */
export const validateUserPermission = async (
  userId: string,
  action: 'read' | 'write' | 'delete',
  resourceType: 'room' | 'relationship' | 'document' | 'complaint',
  resourceId?: string
): Promise<boolean> => {
  try {
    const authResult = await validateAuthentication();
    
    if (!authResult.isValid || authResult.userId !== userId) {
      return false;
    }
    
    // For now, implement basic permission checking
    // This can be extended with more sophisticated role-based access control
    switch (resourceType) {
      case 'room':
        if (action === 'write' || action === 'delete') {
          // Only room owners can modify rooms
          if (resourceId) {
            const { data: room } = await supabase
              .from('rooms')
              .select('owner_id')
              .eq('id', resourceId)
              .single();
            
            return room?.owner_id === userId;
          }
        }
        return true; // Anyone can read rooms
        
      case 'relationship':
        // Users can only access their own relationships
        if (resourceId) {
          const { data: relationship } = await supabase
            .from('relationships')
            .select('owner_id, renter_id')
            .eq('id', resourceId)
            .single();
          
          return relationship?.owner_id === userId || relationship?.renter_id === userId;
        }
        return true;
        
      case 'document':
        // Users can only access documents in their relationships
        if (resourceId) {
          const { data: document } = await supabase
            .from('documents')
            .select('user_id, relationship_id')
            .eq('id', resourceId)
            .single();
          
          if (document?.user_id === userId) return true;
          
          // Check if user is participant in the relationship
          const { data: relationship } = await supabase
            .from('relationships')
            .select('owner_id, renter_id')
            .eq('id', document?.relationship_id)
            .single();
          
          return relationship?.owner_id === userId || relationship?.renter_id === userId;
        }
        return true;
        
      case 'complaint':
        // Users can only access complaints they're involved in
        if (resourceId) {
          const { data: complaint } = await supabase
            .from('complaints')
            .select('owner_id, renter_id')
            .eq('id', resourceId)
            .single();
          
          return complaint?.owner_id === userId || complaint?.renter_id === userId;
        }
        return true;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Permission validation error:', error);
    return false;
  }
};

/**
 * Validate session token integrity
 */
export const validateSessionIntegrity = async (): Promise<boolean> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return false;
    }
    
    // Additional checks can be added here for session integrity
    return true;
  } catch {
    return false;
  }
};
