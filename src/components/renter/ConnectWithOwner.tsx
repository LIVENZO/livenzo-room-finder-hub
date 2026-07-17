
import React, { useState, useEffect, useRef } from 'react';
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
  const fetchStartedRef = useRef(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
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

  // Track when the initial relationship fetch has truly completed so we only
  // auto-open the scanner after confirming the renter is not connected.
  useEffect(() => {
    if (loading) {
      fetchStartedRef.current = true;
    } else if (fetchStartedRef.current) {
      setInitialLoadComplete(true);
    }
  }, [loading]);

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
  // Only auto-open the scanner after the initial relationship check confirms
  // the renter is not already connected.
  const shouldAutoOpenScanner = initialLoadComplete && !activeRelationship;

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
        autoOpenScanner={shouldAutoOpenScanner}
      />
      
      {/* Previous Connections Section */}
      <PreviousConnections renterId={currentUserId} />
    </div>
  );
};

export default ConnectWithOwner;
