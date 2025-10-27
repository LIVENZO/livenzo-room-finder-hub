
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  fetchOwnerRelationships,
  updateRelationshipStatus,
  type Relationship 
} from '@/services/relationship';
import { fetchUserProfile } from '@/services/UserProfileService';
import { isProfileComplete } from '@/utils/profileUtils';

export const useRentersManagement = (
  currentUserId: string,
  documentNotification?: {
    showDocuments: boolean;
    documentId?: string;
    renterId?: string;
  },
  specificRenterData?: {
    relationshipId: string;
    documentId?: string;
    complaintId?: string;
    openRenterDetail: boolean;
  }
) => {
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [viewMode, setViewMode] = useState<'full' | 'documents' | 'complaints'>('full');
  const [showSetRentModal, setShowSetRentModal] = useState(false);
  const [renterForRent, setRenterForRent] = useState<{ id: string; full_name: string } | null>(null);

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

  // Handle document notification navigation
  useEffect(() => {
    if (documentNotification?.showDocuments && documentNotification.renterId && relationships.length > 0) {
      const renterRelationship = relationships.find(r => r.renter_id === documentNotification.renterId);
      if (renterRelationship) {
        setSelectedRelationship(renterRelationship);
        setSelectedTab('documents');
        setViewMode('documents');
      }
    }
  }, [documentNotification, relationships]);

  // Handle specific renter navigation from deep link
  useEffect(() => {
    if (specificRenterData?.openRenterDetail && specificRenterData.relationshipId && relationships.length > 0) {
      const renterRelationship = relationships.find(r => r.id === specificRenterData.relationshipId);
      if (renterRelationship) {
        setSelectedRelationship(renterRelationship);
        
        // Determine which tab to show based on what data is present
        if (specificRenterData.documentId) {
          setSelectedTab('documents');
          setViewMode('documents');
        } else if (specificRenterData.complaintId) {
          setSelectedTab('complaints');
          setViewMode('complaints');
        } else {
          setSelectedTab('overview');
          setViewMode('full');
        }
      }
    }
  }, [specificRenterData, relationships]);

  const handleAccept = async (relationshipId: string) => {
    // Check if basic profile is complete before accepting
    try {
      const profile = await fetchUserProfile(currentUserId);
      if (!isProfileComplete(profile)) {
        toast.info('Please complete your basic profile information before accepting a renter\'s request.');
        navigate('/profile?tab=basic&returnTo=/connections');
        return;
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      toast.error('Unable to verify profile. Please try again.');
      return;
    }

    setProcessingIds(prev => [...prev, relationshipId]);
    try {
      await updateRelationshipStatus(relationshipId, 'accepted');
      toast.success('Connection request accepted');
      await fetchRelationships();
      
      // Get the accepted relationship to show Set Rent modal
      const acceptedRelationship = relationships.find(r => r.id === relationshipId);
      if (acceptedRelationship?.renter) {
        setRenterForRent({
          id: acceptedRelationship.renter_id,
          full_name: acceptedRelationship.renter.full_name
        });
        setShowSetRentModal(true);
      }
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
    setViewMode('documents'); // Set mode to documents only
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
    setViewMode('complaints'); // Set mode to complaints only
  };

  const handleBackToList = () => {
    setSelectedRelationship(null);
    setSelectedTab('overview');
    setViewMode('full'); // Reset to full mode
  };

  return {
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
    handleChat,
    handleComplaints,
    handleBackToList,
    setViewMode,
    showSetRentModal,
    setShowSetRentModal,
    renterForRent,
  };
};
