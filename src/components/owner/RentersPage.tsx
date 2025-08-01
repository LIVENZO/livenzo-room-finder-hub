
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import RenterDetailPanel from './RenterDetailPanel';
import RenterCard from './components/RenterCard';
import PendingRequestCard from './components/PendingRequestCard';
import EmptyState from './components/EmptyState';
import { useRentersManagement } from './hooks/useRentersManagement';

interface RentersPageProps {
  currentUserId: string;
}

const RentersPage: React.FC<RentersPageProps> = ({ currentUserId }) => {
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
    setViewMode, // Add this from the hook
  } = useRentersManagement(currentUserId);

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
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <p className="text-lg">Loading renters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">

      <Tabs defaultValue="requests" className="w-full">
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
    </div>
  );
};

export default RentersPage;
