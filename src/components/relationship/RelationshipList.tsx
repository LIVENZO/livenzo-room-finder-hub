
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateRelationshipStatus } from '@/services/relationship';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import OwnerConnectionTabs from './tabs/OwnerConnectionTabs';
import RenterConnectionTabs from './tabs/RenterConnectionTabs';
import { Relationship } from '@/types/relationship';

interface RelationshipListProps {
  ownerRelationships: Relationship[];
  renterRelationships: Relationship[];
  onStatusChange?: () => void;
  isOwner: boolean;
  isLoading?: boolean;
  onRelationshipSelect?: (relationship: Relationship) => void;
}

const RelationshipList: React.FC<RelationshipListProps> = ({ 
  ownerRelationships, 
  renterRelationships, 
  onStatusChange,
  isOwner,
  isLoading = false,
  onRelationshipSelect
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(isOwner ? 'received' : 'sent');
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  
  const handleAccept = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'accepted');
      onStatusChange?.();
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };
  
  const handleDecline = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'declined');
      onStatusChange?.();
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };
  
  const openChat = (roomId: string) => {
    navigate(`/chats/${roomId}`);
  };
  
  const handleSelectRelationship = (relationship: Relationship) => {
    if (onRelationshipSelect) {
      onRelationshipSelect(relationship);
    }
  };

  const pendingOwnerRelationships = ownerRelationships.filter(r => r.status === 'pending');
  const activeOwnerRelationships = ownerRelationships.filter(r => r.status === 'accepted');
  
  const pendingRenterRelationships = renterRelationships.filter(r => r.status === 'pending');
  const activeRenterRelationships = renterRelationships.filter(r => r.status === 'accepted');
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Connection Requests</CardTitle>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={isOwner ? 'received' : 'sent'}>
              {isOwner ? 'Received' : 'Sent'} Requests
              {isOwner && pendingOwnerRelationships.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingOwnerRelationships.length}</Badge>
              )}
              {!isOwner && pendingRenterRelationships.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingRenterRelationships.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Connections
              {isOwner && activeOwnerRelationships.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeOwnerRelationships.length}</Badge>
              )}
              {!isOwner && activeRenterRelationships.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeRenterRelationships.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {isOwner ? (
            <OwnerConnectionTabs
              ownerRelationships={ownerRelationships}
              processingIds={processingIds}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onChatOpen={openChat}
              onSelect={handleSelectRelationship}
              isLoading={isLoading}
            />
          ) : (
            <RenterConnectionTabs
              renterRelationships={renterRelationships}
              onChatOpen={openChat}
              onSelect={handleSelectRelationship}
              isLoading={isLoading}
            />
          )}
        </Tabs>
      </CardHeader>
      <CardContent>
      </CardContent>
    </Card>
  );
};

export default RelationshipList;
