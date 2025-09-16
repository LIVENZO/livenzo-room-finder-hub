
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/context/auth/FirebaseAuthProvider';
import { FirebaseAuthFlow } from '@/components/auth/FirebaseAuthFlow';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import LoadingState from '@/components/landing/LoadingState';
import StatCards from '@/components/landing/StatCards';
import RoleSelector from '@/components/landing/RoleSelector';

const Index: React.FC = () => {
  const { user, isLoading, userRole } = useFirebaseAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>('renter');
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if we have a user and redirect if needed
    if (user && userRole) {
      console.log("User detected on index page, navigating to dashboard:", user.uid);
      setIsRedirecting(true);
      
      // Navigate to dashboard
      navigate('/dashboard');
      toast.success("Welcome to Livenzo!");
    }
  }, [user, userRole, navigate]);
  
  const handleAuthSuccess = () => {
    // Store the selected role
    localStorage.setItem('selectedRole', selectedRole);
    localStorage.setItem('userRole', selectedRole);
    
    // Navigation will be handled by the useEffect above
    toast.success("Authentication successful!");
  };
  
  // Show a loading state while redirecting
  if (isRedirecting) {
    return <LoadingState isRedirecting={isRedirecting} />;
  }

  // If user is authenticated, they should be redirected by the useEffect
  if (user && userRole) {
    return <LoadingState isRedirecting={true} />;
  }
  
  return (
    <Layout hideNav>
      <div className="w-full h-full min-h-screen flex flex-col justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="w-full flex-1 flex flex-col justify-center p-6 space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary">Livenzo</h1>
            <p className="text-xl md:text-2xl text-gray-600">Find Your Perfect Room Today</p>
          </div>
          
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg space-y-6">
              <RoleSelector 
                userRole={selectedRole}
                setUserRole={setSelectedRole}
                canChangeRole={true}
              />
              
              <FirebaseAuthFlow onAuthSuccess={handleAuthSuccess} />
            </div>
          </div>
          
          <div className="w-full">
            <StatCards />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
