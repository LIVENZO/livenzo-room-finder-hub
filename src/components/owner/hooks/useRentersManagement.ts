
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  fetchOwnerRelationships,
  updateRelationshipStatus,
  type Relationship 
} from '@/services/relationship';

export const useRentersManagement = (currentUserId: string) => {
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('overview');

  const fetchRelationships = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchOwnerRelationships(currentUserId);
      setRelationships(data);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast.error('Failed to load renters');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const handleAccept = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'accepted');
      toast.success('Connection request accepted');
      await fetchRelationships();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };

  const handleDecline = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'declined');
      toast.success('Connection request declined');
      await fetchRelationships();
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };

  const handleDisconnect = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'declined');
      toast.success('Renter disconnected successfully');
      await fetchRelationships();
    } catch (error) {
      console.error('Error disconnecting renter:', error);
      toast.error('Failed to disconnect renter');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };

  const handleDocuments = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setSelectedTab('documents');
  };

  const handleChat = (relationship: Relationship) => {
    if (relationship.chat_room_id) {
      navigate(`/chats/${relationship.chat_room_id}`);
    } else {
      toast.error('Chat room not available');
    }
  };

  const handleComplaints = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setSelectedTab('complaints');
  };

  const handleBackToList = () => {
    setSelectedRelationship(null);
    setSelectedTab('overview');
  };

  return {
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
    handleBackToList,
  };
};
