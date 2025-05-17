
import { createContext, useContext } from 'react';
import { AuthContextType } from './types';

// Create the initial context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  session: null,
  userRole: null,
  isOwner: false,
  currentUser: null,
  canChangeRole: true
});

// Hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
