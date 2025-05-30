
import React, { useState } from 'react';
import { useRelationships } from '@/hooks/useRelationships';
import ConnectionOverview from '@/components/relationship/ConnectionOverview';
import PostConnectionInterface from '@/components/renter/PostConnectionInterface';
import OwnerProfilePage from '@/components/renter/OwnerProfilePage';
import PreviousConnections from '@/components/renter/PreviousConnections';

interface ConnectWithOwnerProps {
  currentUserId: string;
}

const ConnectWithOwner: React.FC<ConnectWithOwnerProps> = ({ currentUserId }) => {
  const [viewMode, setViewMode] = useState<'overview' | 'profile' | 'interface'>('overview');
  
  const {
    renterRelationships,
    selectedRelationship,
    documents,
    loading,
    fetchRelationships,
    handleRelationshipSelect,
    handleDocumentUploaded,
    handleBack,
    refreshRelationships
  } = useRelationships(currentUserId, false);

  // Find the active (accepted) relationship
  const activeRelationship = renterRelationships.find(rel => rel.status === 'accepted');

  const handleOwnerProfileView = (relationship: any) => {
    handleRelationshipSelect(relationship);
    setViewMode('profile');
  };

  const handleInterfaceView = (relationship: any) => {
    handleRelationshipSelect(relationship);
    setViewMode('interface');
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    handleBack();
    // Refresh relationships to get updated status
    refreshRelationships();
  };

  // If viewing owner profile
  if (viewMode === 'profile' && selectedRelationship) {
    return (
      <OwnerProfilePage
        relationship={selectedRelationship}
        onBack={handleBackToOverview}
      />
    );
  }

  // If viewing post-connection interface
  if (viewMode === 'interface' && selectedRelationship) {
    return (
      <PostConnectionInterface
        relationship={selectedRelationship}
        currentUserId={currentUserId}
      />
    );
  }

  // Default overview mode
  return (
    <div className="space-y-6">
      <ConnectionOverview
        currentUserId={currentUserId}
        isOwner={false}
        ownerRelationships={[]}
        renterRelationships={renterRelationships}
        onRelationshipSelect={handleOwnerProfileView}
        onStatusChange={refreshRelationships}
        isLoading={loading}
      />
      
      {/* Show active connection interface if available */}
      {activeRelationship && (
        <div className="mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900">
                  Connected to {activeRelationship.owner?.full_name}
                </h3>
                <p className="text-sm text-green-700">
                  Access your rental management tools
                </p>
              </div>
              <button
                onClick={() => handleInterfaceView(activeRelationship)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Manage Connection
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Previous Connections Section */}
      <PreviousConnections renterId={currentUserId} />
    </div>
  );
};

export default ConnectWithOwner;
