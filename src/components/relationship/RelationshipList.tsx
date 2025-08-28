import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateRelationshipStatus } from '@/services/relationship';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import OwnerConnectionTabs from './tabs/OwnerConnectionTabs';
import RenterConnectionTabs from './tabs/RenterConnectionTabs';
import { Relationship } from '@/types/relationship';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { toast } from 'sonner';
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
  const {
    requireComplete
  } = useProfileCompletion();
  const handleAccept = async (relationshipId: string) => {
    // Check profile completion only for owners accepting requests
    if (isOwner && !requireComplete()) {
      return;
    }
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
  return <Card className="w-full">
      
      
    </Card>;
};
export default RelationshipList;