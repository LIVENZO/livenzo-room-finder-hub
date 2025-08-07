
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/auth';
import { useNavigate } from 'react-router-dom';
import ConnectWithOwner from '@/components/renter/ConnectWithOwner';
import RentersPage from '@/components/owner/RentersPage';

const Connections = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const isOwner = userRole === 'owner';
  
  useEffect(() => {
    if (!isLoading && !user?.id) {
      navigate('/');
    }
  }, [user?.id, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="w-full h-full p-6">
          <div className="text-center p-8">
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!user?.id) {
    return (
      <Layout>
        <div className="w-full h-full p-6">
          <div className="text-center p-8">
            <p className="text-lg">Please login to manage connections</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getPageTitle = () => {
    return isOwner ? 'Renters' : 'Find Your Owner';
  };

  const getPageDescription = () => {
    return isOwner 
      ? 'Manage connection requests and connected renters'
      : 'Connect with your property owner to manage your rental relationship';
  };
  
  return (
    <Layout>
      <div className="w-full h-full p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
          <p className="text-gray-500">{getPageDescription()}</p>
        </div>
        
        {isOwner ? (
          <RentersPage currentUserId={user.id} />
        ) : (
          <ConnectWithOwner currentUserId={user.id} />
        )}
      </div>
    </Layout>
  );
};

export default Connections;
