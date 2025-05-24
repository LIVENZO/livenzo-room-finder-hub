
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/auth';
import { useNavigate, useParams } from 'react-router-dom';
import ConnectionOverview from '@/components/relationship/ConnectionOverview';
import ConnectionDetails from '@/components/relationship/ConnectionDetails';
import FindYourOwner from '@/components/renter/FindYourOwner';
import OwnerProfilePage from '@/components/renter/OwnerProfilePage';
import { useRelationships } from '@/hooks/useRelationships';

const Connections = () => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const { relationshipId } = useParams<{ relationshipId: string }>();
  const isOwner = userRole === 'owner';
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);
  
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

  const handleOwnerSelect = (relationship: any) => {
    setShowOwnerProfile(true);
    handleRelationshipSelect(relationship);
  };

  const handleBackToFindOwner = () => {
    setShowOwnerProfile(false);
    handleBack();
  };
  
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

  const getPageTitle = () => {
    if (isOwner) return 'Connections';
    if (showOwnerProfile) return 'Your Property Owner';
    return 'Find Your Owner';
  };

  const getPageDescription = () => {
    if (isOwner) return 'Manage your owner-renter relationships and documents';
    if (showOwnerProfile) return 'Manage your rental relationship and communications';
    return 'Connect with your property owner to manage your rental relationship';
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
          <p className="text-gray-500">{getPageDescription()}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {isOwner ? (
            // Owner view - existing functionality
            !selectedRelationship ? (
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
            )
          ) : (
            // Renter view - new functionality
            showOwnerProfile && selectedRelationship ? (
              <OwnerProfilePage 
                relationship={selectedRelationship}
                onBack={handleBackToFindOwner}
              />
            ) : selectedRelationship ? (
              <ConnectionDetails
                selectedRelationship={selectedRelationship}
                isOwner={false}
                documents={documents}
                onDocumentUploaded={handleDocumentUploaded}
                onBackClick={handleBack}
              />
            ) : (
              <FindYourOwner
                currentUserId={user.id}
                renterRelationships={renterRelationships}
                onOwnerSelect={handleOwnerSelect}
              />
            )
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Connections;
