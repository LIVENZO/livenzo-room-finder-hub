
import { useState, useEffect } from 'react';
import { fetchOwnerRelationships, updateRelationshipStatus } from '@/services/relationship';
import { Relationship } from '@/types/relationship';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useRentersManagement = (currentUserId: string) => {
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  const loadRelationships = async () => {
    setLoading(true);
    try {
      const data = await fetchOwnerRelationships(currentUserId);
      setRelationships(data);
    } catch (error) {
      console.error('Error loading relationships:', error);
      toast.error('Failed to load renter requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelationships();
  }, [currentUserId]);

  const handleAccept = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'accepted');
      await loadRelationships();
      toast.success('Connection request accepted');
    } catch (error) {
      toast.error('Failed to accept request');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };

  const handleDecline = async (relationshipId: string) => {
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'declined');
      await loadRelationships();
      toast.success('Connection request declined');
    } catch (error) {
      toast.error('Failed to decline request');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };

  const handleDisconnect = async (relationshipId: string) => {
    if (!window.confirm('Are you sure you want to disconnect this renter?')) {
      return;
    }
    
    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'declined');
      await loadRelationships();
      toast.success('Renter disconnected');
    } catch (error) {
      toast.error('Failed to disconnect renter');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== relationshipId));
    }
  };

  const handleDocuments = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
  };

  const handleChat = (relationship: Relationship) => {
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  const handleComplaints = (relationship: Relationship) => {
    navigate(`/chats/${relationship.chat_room_id}`);
  };

  const handlePayments = (relationship: Relationship) => {
    console.log('Navigate to payments for relationship:', relationship.id);
    toast.info('Payment management feature coming soon');
  };

  const handleBackToList = () => {
    setSelectedRelationship(null);
    loadRelationships();
  };

  return {
    relationships,
    loading,
    processingIds,
    selectedRelationship,
    loadRelationships,
    handleAccept,
    handleDecline,
    handleDisconnect,
    handleDocuments,
    handleChat,
    handleComplaints,
    handlePayments,
    handleBackToList,
  };
};
