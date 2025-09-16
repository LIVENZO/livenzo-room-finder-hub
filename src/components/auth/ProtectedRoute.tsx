import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/context/auth/FirebaseAuthProvider';
import { FirebaseAuthFlow } from '@/components/auth/FirebaseAuthFlow';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import RoleSelector from '@/components/landing/RoleSelector';
import Layout from '@/components/Layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'owner' | 'renter';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading, userRole } = useFirebaseAuth();
  const [selectedRole, setSelectedRole] = useState<string>('renter');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    // Store the selected role
    localStorage.setItem('selectedRole', selectedRole);
    localStorage.setItem('userRole', selectedRole);
    
    toast.success("Authentication successful!");
  };

  if (!user) {
    // Show inline sign-in instead of redirecting
    return (
      <Layout hideNav>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-primary">Welcome to Livenzo</h1>
                <p className="text-muted-foreground">Please sign in to continue</p>
              </div>
              
              <RoleSelector 
                userRole={selectedRole}
                setUserRole={setSelectedRole}
                canChangeRole={true}
              />
              
              <FirebaseAuthFlow onAuthSuccess={handleAuthSuccess} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};