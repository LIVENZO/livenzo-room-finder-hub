
import React from 'react';
import { useAuth } from '@/context/auth';
import Layout from '@/components/Layout';
import RenterDashboard from '@/components/dashboard/RenterDashboard';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';
import LoadingState from '@/components/landing/LoadingState';
import { AUTH_CONFIG } from '@/config/auth';

const Dashboard: React.FC = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading || !userRole) {
    return <LoadingState isRedirecting={false} />;
  }

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
