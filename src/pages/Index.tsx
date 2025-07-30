
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import LoadingState from '@/components/landing/LoadingState';
import LandingCard from '@/components/landing/LandingCard';
import StatCards from '@/components/landing/StatCards';
import { AUTH_CONFIG } from '@/config/auth';

const Index: React.FC = () => {
  const { user, login, isLoading, session, canChangeRole } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('renter');
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      // If auth is disabled, redirect directly to dashboard
      if (!AUTH_CONFIG.AUTH_ENABLED) {
        console.log("Auth disabled, redirecting to dashboard");
        setIsRedirecting(true);
        
        // Set default role if not already set
        if (!localStorage.getItem('userRole')) {
          localStorage.setItem('userRole', userRole);
          console.log("Setting default user role:", userRole);
        }
        
        navigate('/dashboard');
        toast.success("Welcome to Livenzo!");
        return;
      }
      
      // Check if we have a user session and redirect if needed
      if (session && user) {
        console.log("User detected on index page, navigating to dashboard:", user.email);
        setIsRedirecting(true);
        
        // Store the user role if it wasn't already set during login
        if (!localStorage.getItem('userRole')) {
          localStorage.setItem('userRole', userRole);
          console.log("Setting default user role:", userRole);
        }
        
        // Navigate directly to dashboard instead of using window.location
        navigate('/dashboard');
        const userName = user.email?.split('@')[0] || 'User';
        toast.success(`Welcome, ${userName}!`);
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
  
  const handleGoogleLogin = async () => {
    console.log("Google login button clicked with role:", userRole);
    localStorage.setItem('selectedRole', userRole);
    toast.info("Redirecting to Google sign-in...");
    await login('google', userRole);
  };

  const handleFacebookLogin = async () => {
    console.log("Facebook login button clicked with role:", userRole);
    localStorage.setItem('selectedRole', userRole);
    toast.info("Redirecting to Facebook sign-in...");
    await login('facebook', userRole);
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
            handleGoogleLogin={handleGoogleLogin}
            handleFacebookLogin={handleFacebookLogin}
          />
          
          <StatCards />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
