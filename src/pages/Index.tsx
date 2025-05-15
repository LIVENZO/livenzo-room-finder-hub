
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Index: React.FC = () => {
  const { user, login, isLoading, session } = useAuth();
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
        
        // Add a small delay to ensure everything is loaded properly
        const timer = setTimeout(() => {
          navigate('/dashboard');
          toast.success(`Welcome, ${user.email?.split('@')[0] || 'User'}!`);
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
  }, [user, session, navigate, isLoading]);
  
  const handleLogin = () => {
    console.log("Login button clicked with role:", userRole);
    // Store the selected role in localStorage to be used after authentication
    localStorage.setItem('userRole', userRole);
    toast.info("Redirecting to Google sign-in...");
    login('google');
  };
  
  // Show a loading state while checking for existing session
  if (isLoading || checkingSession || isRedirecting) {
    return (
      <Layout hideNav>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
          <div className="max-w-md w-full mx-auto text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-primary">Livenzo</h1>
              <p className="text-xl text-gray-600">
                {isRedirecting ? "Redirecting to dashboard..." : "Loading..."}
              </p>
            </div>
            <div className="bg-white/50 p-8 rounded-xl shadow-lg space-y-6 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout hideNav>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <div className="max-w-md w-full mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">Livenzo</h1>
            <p className="text-xl text-gray-600">Find Your Perfect Room Today</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold">Welcome to Livenzo</h2>
              <p className="text-gray-500">
                Connect with room owners or find tenants for your property.
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="font-medium text-gray-700">I am a:</p>
              <RadioGroup 
                value={userRole} 
                onValueChange={setUserRole} 
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="owner" id="owner" />
                  <label htmlFor="owner" className="w-full cursor-pointer">Property Owner</label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="renter" id="renter" />
                  <label htmlFor="renter" className="w-full cursor-pointer">Renter</label>
                </div>
              </RadioGroup>
            </div>
            
            <Button 
              onClick={handleLogin} 
              className="w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>
            
            <div className="text-sm text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="font-bold text-lg">1000+</div>
              <div className="text-sm text-gray-500">Available Rooms</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="font-bold text-lg">500+</div>
              <div className="text-sm text-gray-500">Happy Users</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="font-bold text-lg">50+</div>
              <div className="text-sm text-gray-500">Cities</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
