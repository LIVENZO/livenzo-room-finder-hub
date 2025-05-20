
import React, { useContext } from 'react';
import Layout from '@/components/Layout';
import { AuthContext } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import ConnectionOverview from '@/components/relationship/ConnectionOverview';
import ConnectionDetails from '@/components/relationship/ConnectionDetails';
import { useRelationships } from '@/hooks/useRelationships';

const Connections = () => {
  const { currentUser, isOwner } = useContext(AuthContext);
  const navigate = useNavigate();
  const { relationshipId } = useParams<{ relationshipId: string }>();
  
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
  } = useRelationships(currentUser?.id, isOwner || false, relationshipId);
  
  if (!currentUser?.id) {
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
              currentUserId={currentUser.id}
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
