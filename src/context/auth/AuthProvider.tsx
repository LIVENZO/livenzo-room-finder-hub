
import React from 'react';
import { AuthContext } from './AuthContext';
import { useAuthState } from './hooks/useAuthState';
import { useAuthMethods } from './hooks/useAuthMethods';
import { AUTH_CONFIG } from '@/config/auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    session,
    isLoading: authStateLoading,
    userRole,
    isOwner,
    currentUser,
    canChangeRole,
    setUserRole,
    checkRoleConflict
  } = useAuthState();
  
  const {
    login,
    logout,
    isLoading: authMethodsLoading,
    setIsLoading
  } = useAuthMethods();

  // Combined loading state
  const isLoading = authStateLoading || authMethodsLoading;

  // Create mock auth state when authentication is disabled
  const mockAuthState = React.useMemo(() => {
    if (!AUTH_CONFIG.AUTH_ENABLED) {
      return {
        user: { 
          id: 'mock-user-id',
          email: 'mock@user.com',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        },
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: 'bearer',
          user: {
            id: 'mock-user-id',
            email: 'mock@user.com',
            user_metadata: {},
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          }
        },
        isLoading: false,
        userRole: userRole || 'renter',
        isOwner: userRole === 'owner',
        currentUser: {
          id: 'mock-user-id',
          email: 'mock@user.com',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        },
        canChangeRole: true
      };
    }
    return null;
  }, [userRole]);

  // Use mock state if auth is disabled, otherwise use real auth state
  const authState = AUTH_CONFIG.AUTH_ENABLED ? {
    user,
    session,
    isLoading,
    userRole,
    isOwner,
    currentUser,
    canChangeRole
  } : mockAuthState;
  
  // Debug provider state
  React.useEffect(() => {
    console.log("AuthProvider state:", { 
      user: user?.email, 
      sessionActive: !!session, 
      isLoading, 
      userRole 
    });
  }, [user, session, isLoading, userRole]);
  
  return (
    <AuthContext.Provider value={{ 
      user: authState.user, 
      session: authState.session, 
      isLoading: authState.isLoading, 
      login, 
      logout, 
      userRole: authState.userRole,
      isOwner: authState.isOwner,
      currentUser: authState.currentUser,
      canChangeRole: authState.canChangeRole,
      checkRoleConflict
    }}>
      {children}
    </AuthContext.Provider>
  );
};
