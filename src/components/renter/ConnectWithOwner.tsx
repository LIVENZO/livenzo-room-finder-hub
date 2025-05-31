
import React, { useState, useEffect } from 'react';
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

  // Auto-redirect to interface if there's an active connection
  useEffect(() => {
    if (activeRelationship && viewMode === 'overview') {
      handleRelationshipSelect(activeRelationship);
      setViewMode('interface');
    }
  }, [activeRelationship, viewMode, handleRelationshipSelect]);

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

  // If viewing post-connection interface (including auto-redirect for active connections)
  if (viewMode === 'interface' && selectedRelationship) {
    return (
      <PostConnectionInterface
        relationship={selectedRelationship}
        currentUserId={currentUserId}
      />
    );
  }

  // Default overview mode (only shown if no active connection)
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
      
      {/* Previous Connections Section */}
      <PreviousConnections renterId={currentUserId} />
    </div>
  );
};

export default ConnectWithOwner;
