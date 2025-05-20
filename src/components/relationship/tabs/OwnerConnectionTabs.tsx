
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { Relationship } from '@/types/relationship';
import PendingRequestCard from '../cards/PendingRequestCard';
import ActiveConnectionCard from '../cards/ActiveConnectionCard';

interface OwnerConnectionTabsProps {
  ownerRelationships: Relationship[];
  processingIds: string[];
  onAccept: (relationshipId: string) => Promise<void>;
  onDecline: (relationshipId: string) => Promise<void>;
  onChatOpen: (roomId: string) => void;
  onSelect?: (relationship: Relationship) => void;
  isLoading: boolean;
}

const OwnerConnectionTabs: React.FC<OwnerConnectionTabsProps> = ({
  ownerRelationships,
  processingIds,
  onAccept,
  onDecline,
  onChatOpen,
  onSelect,
  isLoading,
}) => {
  const pendingOwnerRelationships = ownerRelationships.filter(r => r.status === 'pending');
  const activeOwnerRelationships = ownerRelationships.filter(r => r.status === 'accepted');
  
  const handleCardClick = (relationship: Relationship) => {
    if (onSelect && relationship.status === 'accepted') {
      onSelect(relationship);
    }
  };
  
  return (
    <>
      <TabsContent value="received" className="space-y-4 mt-4">
        {isLoading ? (
          <div className="text-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading connection requests...</p>
          </div>
        ) : pendingOwnerRelationships.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No pending requests received.
          </div>
        ) : (
          pendingOwnerRelationships.map(relationship => (
            <PendingRequestCard
              key={relationship.id}
              relationship={relationship}
              isOwner={true}
              onAccept={onAccept}
              onDecline={onDecline}
              isProcessing={processingIds.includes(relationship.id)}
            />
          ))
        )}
      </TabsContent>
      
      <TabsContent value="active" className="space-y-4 mt-4">
        {isLoading ? (
          <div className="text-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading active connections...</p>
          </div>
        ) : activeOwnerRelationships.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No active connections.
          </div>
        ) : (
          activeOwnerRelationships.map(relationship => (
            <div 
              key={relationship.id}
              onClick={() => handleCardClick(relationship)}
              className={onSelect ? "cursor-pointer" : ""}
            >
              <ActiveConnectionCard
                relationship={relationship}
                isOwner={true}
                onChatOpen={onChatOpen}
              />
            </div>
          ))
        )}
      </TabsContent>
    </>
  );
};

export default OwnerConnectionTabs;
