
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import LoadingState from '@/components/landing/LoadingState';
import LandingCard from '@/components/landing/LandingCard';
import StatCards from '@/components/landing/StatCards';

const Index: React.FC = () => {
  const { user, login, isLoading, session, canChangeRole } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('renter');
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      // Check if we have a user session and redirect if needed
      if (session && user) {
        console.log("User detected on index page, navigating to dashboard:", user.email);
        setIsRedirecting(true);
        
        // Store the user role if it wasn't already set during login
        if (!localStorage.getItem('userRole')) {
          localStorage.setItem('userRole', userRole);
          console.log("Setting default user role:", userRole);
        }
        
        // Add a small delay to ensure everything is loaded properly
        const timer = setTimeout(() => {
          navigate('/dashboard');
          const userName = user.email?.split('@')[0] || 'User';
          toast.success(`Welcome, ${userName}!`);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        console.log("No user detected on index page");
        setCheckingSession(false);
      }
    };
    
    // Only run the check if we're done with initial loading
    if (!isLoading) {
      checkAuth();
    }
  }, [user, session, navigate, isLoading, userRole]);
  
  const handleLogin = () => {
    console.log("Login button clicked with role:", userRole);
    // Store the selected role in localStorage to be used after authentication
    localStorage.setItem('selectedRole', userRole);
    toast.info("Redirecting to Google sign-in...");
    login('google');
  };
  
  // Show a loading state while checking for existing session
  if (isLoading || checkingSession || isRedirecting) {
    return <LoadingState isRedirecting={isRedirecting} />;
  }
  
  return (
    <Layout hideNav>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <div className="max-w-md w-full mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">Livenzo</h1>
            <p className="text-xl text-gray-600">Find Your Perfect Room Today</p>
          </div>
          
          <LandingCard 
            userRole={userRole}
            setUserRole={setUserRole}
            canChangeRole={canChangeRole}
            isLoading={isLoading}
            handleLogin={handleLogin}
          />
          
          <StatCards />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
