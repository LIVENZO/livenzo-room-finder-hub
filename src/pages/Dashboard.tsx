
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { useRooms } from '@/context/RoomContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import EmptyOwnerState from '@/components/dashboard/EmptyOwnerState';
import RoomList from '@/components/dashboard/RoomList';
import RenterDashboard from '@/components/dashboard/RenterDashboard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { getUserRooms } = useRooms();
  const userRooms = getUserRooms();
  const [updatingRoom, setUpdatingRoom] = React.useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // If not logged in, return null
  if (!user) return null;
  
  const isOwner = userRole === 'owner';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <DashboardHeader isOwner={isOwner} />
        
        {isOwner && userRooms.length === 0 ? (
          <EmptyOwnerState />
        ) : isOwner ? (
          <RoomList 
            rooms={userRooms} 
            updatingRoom={updatingRoom} 
            setUpdatingRoom={setUpdatingRoom} 
          />
        ) : (
          <RenterDashboard />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
