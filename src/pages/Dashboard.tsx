
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/context/auth/FirebaseAuthProvider';
import Layout from '@/components/Layout';
import RenterDashboard from '@/components/dashboard/RenterDashboard';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';
import LoadingState from '@/components/landing/LoadingState';
import { toast } from 'sonner';
import { AUTH_CONFIG } from '@/config/auth';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, isLoading } = useFirebaseAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("No authenticated user found, redirecting to login");
      navigate('/');
      toast.error("Please sign in to access the dashboard");
      return;
    }

    // Debug current user state
    console.log("Dashboard - User:", user?.uid, "Role:", userRole, "Loading:", isLoading);
  }, [user, userRole, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingState isRedirecting={false} />;
  }

  // If no user, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <Layout requireAuth>
      <div className="w-full h-full min-h-screen bg-gradient-radial">
        <div className="w-full h-full">
          {userRole === 'owner' ? <OwnerDashboard /> : <RenterDashboard />}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
