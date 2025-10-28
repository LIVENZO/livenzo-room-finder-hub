
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import RenterDetailPanel from './RenterDetailPanel';
import RenterCard from './components/RenterCard';
import PendingRequestCard from './components/PendingRequestCard';
import EmptyState from './components/EmptyState';
import { useRentersManagement } from './hooks/useRentersManagement';
import SetRentModal from '@/components/dashboard/rent-management/SetRentModal';

interface RentersPageProps {
  currentUserId: string;
  defaultTab?: string;
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
  defaultTab, 
  documentNotification, 
  complaintNotification,
  specificRenterData 
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
    if (mode === 'documents') {
      // Set active tab to documents when switching to documents mode
    } else if (mode === 'complaints') {
      // Set active tab to complaints when switching to complaints mode
    }
  };

  // If a renter is selected, show the detail panel with the specific mode
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

  const pendingRequests = relationships.filter(r => r.status === 'pending');
  const connectedRenters = relationships.filter(r => r.status === 'accepted');

  if (loading) {
    return (
      <div className="w-full h-full p-6">
        <div className="text-center">
          <p className="text-lg">Loading renters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-6 p-4">
      <Tabs defaultValue={defaultTab || "requests"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connected" className="flex items-center gap-2">
            Connected
            {connectedRenters.length > 0 && (
              <Badge variant="secondary">{connectedRenters.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
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
        </TabsContent>

        {/* Connected Renters Tab */}
        <TabsContent value="connected" className="space-y-4">
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
        </TabsContent>
      </Tabs>

      {/* Set Rent Modal */}
      <SetRentModal
        isOpen={showSetRentModal}
        onClose={() => setShowSetRentModal(false)}
        renter={renterForRent}
        onSuccess={() => setShowSetRentModal(false)}
      />
    </div>
  );
};

export default RentersPage;
