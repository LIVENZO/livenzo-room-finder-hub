
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { Relationship } from '@/types/relationship';
import PendingRequestCard from '../cards/PendingRequestCard';
import ActiveConnectionCard from '../cards/ActiveConnectionCard';

interface RenterConnectionTabsProps {
  renterRelationships: Relationship[];
  onChatOpen: (roomId: string) => void;
  onSelect?: (relationship: Relationship) => void;
  isLoading: boolean;
}

const RenterConnectionTabs: React.FC<RenterConnectionTabsProps> = ({
  renterRelationships,
  onChatOpen,
  onSelect,
  isLoading,
}) => {
  const pendingRenterRelationships = renterRelationships.filter(r => r.status === 'pending');
  const activeRenterRelationships = renterRelationships.filter(r => r.status === 'accepted');
  
  const handleCardClick = (relationship: Relationship) => {
    if (onSelect && relationship.status === 'accepted') {
      onSelect(relationship);
    }
  };
  
  return (
    <>
      <TabsContent value="sent" className="space-y-4 mt-4">
        {isLoading ? (
          <div className="text-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading sent requests...</p>
          </div>
        ) : pendingRenterRelationships.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No pending requests sent.
          </div>
        ) : (
          pendingRenterRelationships.map(relationship => (
            <PendingRequestCard
              key={relationship.id}
              relationship={relationship}
              isOwner={false}
              isProcessing={false}
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
        ) : activeRenterRelationships.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No active connections.
          </div>
        ) : (
          activeRenterRelationships.map(relationship => (
            <div 
              key={relationship.id}
              onClick={() => handleCardClick(relationship)}
              className={onSelect ? "cursor-pointer" : ""}
            >
              <ActiveConnectionCard
                key={relationship.id}
                relationship={relationship}
                isOwner={false}
                onChatOpen={onChatOpen}
              />
            </div>
          ))
        )}
      </TabsContent>
    </>
  );
};

export default RenterConnectionTabs;
