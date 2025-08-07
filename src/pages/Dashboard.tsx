
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import Layout from '@/components/Layout';
import RenterDashboard from '@/components/dashboard/RenterDashboard';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';
import LoadingState from '@/components/landing/LoadingState';
import { toast } from 'sonner';
import { AUTH_CONFIG } from '@/config/auth';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, isLoading, session } = useAuth();

  useEffect(() => {
    // If authentication is enabled, check for user session
    if (AUTH_CONFIG.AUTH_ENABLED) {
      if (!isLoading && !user && !session) {
        console.log("No authenticated user found, redirecting to login");
        navigate('/');
        toast.error("Please sign in to access the dashboard");
        return;
      }
    }

    // Debug current user state
    console.log("Dashboard - User:", user?.email, "Role:", userRole, "Loading:", isLoading);
  }, [user, userRole, isLoading, session, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
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
