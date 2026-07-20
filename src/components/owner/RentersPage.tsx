
import React from 'react';
import RenterDetailPanel from './RenterDetailPanel';
import RenterCard from './components/RenterCard';
import PendingRequestCard from './components/PendingRequestCard';
import EmptyState from './components/EmptyState';
import { useRentersManagement } from './hooks/useRentersManagement';
import SetRentModal from '@/components/dashboard/rent-management/SetRentModal';

interface RentersPageProps {
  currentUserId: string;
  section: 'requests' | 'connected';
  documentNotification?: {
    showDocuments: boolean;
    documentId?: string;
    renterId?: string;
  };
  complaintNotification?: {
    showComplaints: boolean;
    complaintId?: string;
    renterId?: string;
  };
  specificRenterData?: {
    relationshipId: string;
    documentId?: string;
    complaintId?: string;
    openRenterDetail: boolean;
  };
}

const RentersPage: React.FC<RentersPageProps> = ({
  currentUserId,
  section,
  documentNotification,
  complaintNotification,
  specificRenterData,
}) => {
  const {
    relationships,
    loading,
    processingIds,
    selectedRelationship,
    selectedTab,
    viewMode,
    handleAccept,
    handleDecline,
    handleDisconnect,
    handleDocuments,
    handleComplaints,
    handleBackToList,
    setViewMode,
    showSetRentModal,
    setShowSetRentModal,
    renterForRent,
  } = useRentersManagement(currentUserId, documentNotification, complaintNotification, specificRenterData);

  const handleModeChange = (mode: 'full' | 'documents' | 'complaints') => {
    setViewMode(mode);
  };

  if (selectedRelationship) {
    return (
      <RenterDetailPanel
        relationship={selectedRelationship}
        initialTab={selectedTab}
        mode={viewMode}
        onBack={handleBackToList}
        onRefresh={() => {}}
        onModeChange={handleModeChange}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 p-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
    );
  }

  const pendingRequests = relationships.filter((r) => r.status === 'pending');
  const connectedRenters = relationships.filter((r) => r.status === 'accepted');

  if (section === 'requests') {
    return (
      <div className="animate-fade-in space-y-3">
        {pendingRequests.length === 0 ? (
          <EmptyState type="requests" />
        ) : (
          pendingRequests.map((relationship) => (
            <PendingRequestCard
              key={relationship.id}
              relationship={relationship}
              onAccept={handleAccept}
              onDecline={handleDecline}
              isProcessing={processingIds.includes(relationship.id)}
            />
          ))
        )}

        <SetRentModal
          isOpen={showSetRentModal}
          onClose={() => setShowSetRentModal(false)}
          renter={renterForRent}
          onSuccess={() => setShowSetRentModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-3">
      {connectedRenters.length === 0 ? (
        <EmptyState type="connected" />
      ) : (
        connectedRenters.map((relationship) => (
          <RenterCard
            key={relationship.id}
            relationship={relationship}
            onDocuments={handleDocuments}
            onComplaints={handleComplaints}
            onDisconnect={handleDisconnect}
            isProcessing={processingIds.includes(relationship.id)}
          />
        ))
      )}
    </div>
  );
};

export default RentersPage;
