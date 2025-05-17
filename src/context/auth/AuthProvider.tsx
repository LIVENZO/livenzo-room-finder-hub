
import React from 'react';
import { AuthContext } from './AuthContext';
import { useAuthState } from './hooks/useAuthState';
import { useAuthMethods } from './hooks/useAuthMethods';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    session,
    isLoading: authStateLoading,
    userRole,
    isOwner,
    currentUser,
    canChangeRole
  } = useAuthState();
  
  const {
    login,
    logout,
    isLoading: authMethodsLoading,
    setIsLoading
  } = useAuthMethods();

  // Combined loading state
  const isLoading = authStateLoading || authMethodsLoading;
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      login, 
      logout, 
      userRole,
      isOwner,
      currentUser,
      canChangeRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};
