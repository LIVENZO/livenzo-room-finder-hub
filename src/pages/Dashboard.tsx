
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth'; // Updated import
import Layout from '@/components/Layout';
import RenterDashboard from '@/components/dashboard/RenterDashboard';
import OwnerDashboard from '@/components/dashboard/OwnerDashboard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // If not logged in, return null
  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        
        {userRole === 'owner' ? <OwnerDashboard /> : <RenterDashboard />}
      </div>
    </Layout>
  );
};

export default Dashboard;
