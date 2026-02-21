
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import Layout from '@/components/Layout';
import RenterDashboard from '@/components/dashboard/RenterDashboard';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';
import LoadingState from '@/components/landing/LoadingState';
import { toast } from 'sonner';
import { AUTH_CONFIG } from '@/config/auth';
import { getRoleConflictActive } from '@/context/auth/hooks/useAuthState';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, isLoading, session } = useAuth();

  useEffect(() => {
    // If authentication is enabled, check for user session
    if (AUTH_CONFIG.AUTH_ENABLED) {
      if (!isLoading && !user && !session) {
        console.log("No authenticated user found, redirecting to login");
        navigate('/');
        // Only show error message if NOT caused by role conflict
        if (!getRoleConflictActive()) {
          toast.error("Please sign in to access the dashboard");
        }
        return;
      }
    }

    // Role-based launch: push the default screen on top of Dashboard
    const storedRole = localStorage.getItem('userRole');
    const effectiveRole = storedRole || userRole;
    if (window.location.pathname === '/dashboard') {
      if (effectiveRole === 'renter') {
        const alreadyPushed = sessionStorage.getItem('renterFindRoomPushed');
        if (!alreadyPushed) {
          sessionStorage.setItem('renterFindRoomPushed', 'true');
          navigate('/find-room');
          return;
        }
      } else if (effectiveRole === 'owner') {
        const alreadyPushed = sessionStorage.getItem('ownerListingsPushed');
        if (!alreadyPushed) {
          sessionStorage.setItem('ownerListingsPushed', 'true');
          navigate('/my-listings');
          return;
        }
      }
    }

    // Debug current user state
    console.log("Dashboard - User:", user?.email, "Role:", userRole, "Loading:", isLoading);
  }, [user, userRole, isLoading, session, navigate]);

  // Show loading state while checking authentication or determining role
  if (isLoading || !userRole) {
    return <LoadingState isRedirecting={false} />;
  }

  // If auth is enabled and no user, don't render anything (redirect will happen)
  if (AUTH_CONFIG.AUTH_ENABLED && !user) {
    return null;
  }

  return (
    <Layout>
      <div className="w-full h-full min-h-screen bg-gradient-radial">
        <div className="w-full h-full">
          {userRole === 'owner' ? <OwnerDashboard /> : <RenterDashboard />}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
