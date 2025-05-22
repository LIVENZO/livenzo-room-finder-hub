
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/auth';
import { useNavigate, useParams } from 'react-router-dom';
import ConnectionOverview from '@/components/relationship/ConnectionOverview';
import ConnectionDetails from '@/components/relationship/ConnectionDetails';
import { useRelationships } from '@/hooks/useRelationships';

const Connections = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const isOwner = userRole === 'owner';
  
  const {
    ownerRelationships,
    renterRelationships,
    selectedRelationship,
    documents,
    loading,
    fetchRelationships,
    handleRelationshipSelect,
    handleDocumentUploaded,
    handleBack
  } = useRelationships(user?.id, isOwner || false, relationshipId);
  
  // Force refresh when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      console.log("Connections page: Fetching relationships for user:", user.id);
      fetchRelationships();
    } else if (!isLoading) {
      // If not loading and no user, redirect to login
      navigate('/');
    }
  }, [user?.id, fetchRelationships, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4">
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
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center p-8">
            <p className="text-lg">Please login to manage connections</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-gray-500">Manage your owner-renter relationships and documents</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {!selectedRelationship ? (
            <ConnectionOverview
              currentUserId={user.id}
              isOwner={isOwner || false}
              ownerRelationships={ownerRelationships}
              renterRelationships={renterRelationships}
              onRelationshipSelect={handleRelationshipSelect}
              onStatusChange={fetchRelationships}
              isLoading={loading}
            />
          ) : (
            <ConnectionDetails
              selectedRelationship={selectedRelationship}
              isOwner={isOwner || false}
              documents={documents}
              onDocumentUploaded={handleDocumentUploaded}
              onBackClick={handleBack}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Connections;
