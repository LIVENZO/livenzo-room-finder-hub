
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import LoadingState from '@/components/landing/LoadingState';
import LandingCard from '@/components/landing/LandingCard';
import StatCards from '@/components/landing/StatCards';
import RoomMarquee from '@/components/landing/RoomMarquee';
import { AUTH_CONFIG } from '@/config/auth';
import { useReferral } from '@/hooks/useReferral';
import { getRoleConflictActive, setRoleConflictActive } from '@/context/auth/hooks/useAuthState';

const Index: React.FC = () => {
  const { user, login, sendOTP, verifyOTP, isLoading, session, canChangeRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string>('renter');
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const { captureReferralFromURL, processReferralForNewUser } = useReferral();

  // Capture referral code from URL on mount and clear role conflict flag on landing page
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      sessionStorage.setItem('pendingReferralCode', refCode);
      console.log('Referral code captured:', refCode);
    }

    // Reset the renter find-room push flag on fresh app start
    sessionStorage.removeItem('renterFindRoomPushed');

    // Clear role conflict flag when user arrives at landing page
    if (getRoleConflictActive()) {
      setTimeout(() => setRoleConflictActive(false), 500);
    }
  }, [searchParams]);

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

        const defaultRole = localStorage.getItem('userRole') || userRole;
        if (defaultRole === 'renter') {
          navigate('/dashboard', { replace: true });
          setTimeout(() => navigate('/find-room'), 0);
        } else {
          navigate('/dashboard');
        }
        // No welcome toast per user request
        return;
      }

      // Check if we have a user session and redirect if needed
      if (session && user) {
        console.log("User detected on index page, navigating to dashboard:", user.email);
        setIsRedirecting(true);

        // Process referral for new users only (handled by database function)
        const pendingRef = sessionStorage.getItem('pendingReferralCode');
        if (pendingRef && user.id) {
          await processReferralForNewUser();
        }

        // Store the user role if it wasn't already set during login
        if (!localStorage.getItem('userRole')) {
          localStorage.setItem('userRole', userRole);
          console.log("Setting default user role:", userRole);
        }

        // Renters always launch to Find Room, owners go to dashboard
        const storedRole = localStorage.getItem('userRole');
        if (storedRole === 'renter') {
          navigate('/dashboard', { replace: true });
          setTimeout(() => navigate('/find-room'), 0);
        } else {
          navigate('/dashboard');
        }
        // No welcome toast per user request
      } else {
        console.log("No user detected on index page");
        setCheckingSession(false);
      }
    };

    // Only run the check if we're done with initial loading
    if (!isLoading) {
      checkAuth();
    }
  }, [user, session, navigate, isLoading, userRole, processReferralForNewUser]);

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

  const handleOTPAuth = {
    sendOTP: async (email: string) => {
      console.log("OTP send initiated for:", email, "with role:", userRole);
      localStorage.setItem('selectedRole', userRole);
      await sendOTP(email);
    },
    verifyOTP: async (email: string, token: string) => {
      console.log("OTP verification initiated for:", email, "with role:", userRole);
      await verifyOTP(email, token);
    }
  };

  // Show a loading state while checking for existing session or redirect
  if (checkingSession || isRedirecting) {
    return <LoadingState isRedirecting={isRedirecting} />;
  }

  return (
    <Layout hideNav>
      <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-primary/10 via-background to-background">
        {/* Auto-scrolling room/hostel image carousel */}
        <div className="pt-6 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}>
          <RoomMarquee />
        </div>

        <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center px-5 pb-10 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">Livenzo</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Find your perfect room in Kota</p>
          </div>

          <LandingCard
            userRole={userRole}
            setUserRole={setUserRole}
            canChangeRole={canChangeRole}
            isLoading={isLoading}
            handleGoogleLogin={handleGoogleLogin}
            handleFacebookLogin={handleFacebookLogin}
            handleOTPAuth={handleOTPAuth} />

          <StatCards />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
