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
    handleAccept,
    handleDecline,
    handleDisconnect,
    handleDocuments,
    handleChat,
    handleComplaints,
    handlePayments,
    handleBackToList,
  } = useRentersManagement(currentUserId);

  // If a renter is selected, show the detail panel with the specific tab
  if (selectedRelationship) {
    return (
      <RenterDetailPanel
        relationship={selectedRelationship}
        initialTab={selectedTab}
        onBack={handleBackToList}
        onRefresh={() => {}} // Will be handled by the hook
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Renters</h1>
        <p className="text-gray-600">Manage connection requests and connected renters</p>
      </div>

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
                onChat={handleChat}
                onComplaints={handleComplaints}
                onPayments={handlePayments}
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
