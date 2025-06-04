
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import Layout from '@/components/Layout';
import RenterDashboard from '@/components/dashboard/RenterDashboard';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';
import LoadingState from '@/components/landing/LoadingState';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect if we're sure there's no user (after loading completes)
    if (!isLoading && !user) {
      console.log("No user found, redirecting to login page");
      navigate('/');
    }
  }, [user, navigate, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingState isRedirecting={false} />;
  }

  // If not logged in, return null while the redirect happens
  if (!user) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-radial">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {userRole === 'owner' ? <OwnerDashboard /> : <RenterDashboard />}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
