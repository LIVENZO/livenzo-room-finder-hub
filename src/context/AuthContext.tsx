
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (provider: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('livenzo_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (provider: string) => {
    setIsLoading(true);
    
    // Simulate Google login - in a real app we would use OAuth
    setTimeout(() => {
      const mockUser = {
        id: 'user_' + Math.random().toString(36).substring(2, 9),
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random(),
      };
      
      setUser(mockUser);
      localStorage.setItem('livenzo_user', JSON.stringify(mockUser));
      setIsLoading(false);
      toast.success("Successfully logged in!");
    }, 1000);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('livenzo_user');
    toast.info("You've been logged out.");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
