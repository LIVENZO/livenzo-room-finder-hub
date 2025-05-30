
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchOwnerRelationships, 
  fetchRenterRelationships,
  fetchRelationship,
  type Relationship
} from '@/services/relationship';
import { fetchDocumentsForRelationship, type Document } from '@/services/DocumentService';
import { archivePreviousConnections } from '@/services/relationship/manageRelationships';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useRelationships = (userId: string | undefined, isOwner: boolean, relationshipId?: string) => {
  const navigate = useNavigate();
  const [ownerRelationships, setOwnerRelationships] = useState<Relationship[]>([]);
  const [renterRelationships, setRenterRelationships] = useState<Relationship[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const fetchRelationships = useCallback(async () => {
    if (!userId) {
      toast.error("Please login to manage connections");
      navigate('/');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Fetching relationships for user:", userId, "isOwner:", isOwner);
      
      let owner: Relationship[] = [];
      let renter: Relationship[] = [];
      
      if (isOwner) {
        owner = await fetchOwnerRelationships(userId);
        console.log("Owner relationships loaded:", owner.length);
      } else {
        renter = await fetchRenterRelationships(userId);
        console.log("Renter relationships loaded:", renter.length);
        
        // Check if there's a newly accepted relationship that needs archival
        const acceptedRelationships = renter.filter(r => r.status === 'accepted');
        if (acceptedRelationships.length > 0) {
          const latestAccepted = acceptedRelationships.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0];
          
          // Archive previous connections when user has an accepted relationship
          await archivePreviousConnections(userId, latestAccepted.owner_id);
        }
      }
      
      setOwnerRelationships(owner);
      setRenterRelationships(renter);
      
      // If relationship ID is provided, select that relationship
      if (relationshipId) {
        const relationship = [...owner, ...renter].find(r => r.id === relationshipId);
        if (relationship) {
          // Check if the relationship is still active
          if (relationship.status === 'accepted') {
            setSelectedRelationship(relationship);
            await loadDocuments(relationshipId);
          } else {
            // If relationship is no longer active, clear selection and go back to connections
            setSelectedRelationship(null);
            setDocuments([]);
            toast.info("This connection is no longer active");
            navigate('/connections');
          }
        } else if (relationshipId) {
          // If relationship ID is provided but not found in the loaded relationships,
          // try to fetch it directly
          const fetchedRelationship = await fetchRelationship(relationshipId);
          if (fetchedRelationship && fetchedRelationship.status === 'accepted') {
            setSelectedRelationship(fetchedRelationship);
            await loadDocuments(relationshipId);
          } else {
            // If we still can't find the relationship, it might not exist or user might not have access
            setSelectedRelationship(null);
            setDocuments([]);
            toast.error("Relationship not found or you don't have access to it");
            navigate('/connections');
          }
        }
      }
    } catch (error) {
      console.error("Error fetching relationships:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, [userId, isOwner, relationshipId, navigate]);
  
  const loadDocuments = async (relId: string) => {
    try {
      const docs = await fetchDocumentsForRelationship(relId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };
  
  const handleRelationshipSelect = (relationship: Relationship) => {
    // Only allow selection of active relationships
    if (relationship.status !== 'accepted') {
      toast.error("This relationship is no longer active");
      return;
    }
    
    setSelectedRelationship(relationship);
    loadDocuments(relationship.id);
    // Update URL to include the relationship ID for direct linking
    navigate(`/connections/${relationship.id}`, { replace: true });
  };
  
  const handleDocumentUploaded = async () => {
    if (selectedRelationship) {
      await loadDocuments(selectedRelationship.id);
    }
  };

  const handleBack = () => {
    setSelectedRelationship(null);
    setDocuments([]);
    // Remove relationship ID from URL
    navigate('/connections', { replace: true });
    // Refresh relationships to get latest status
    fetchRelationships();
  };

  // Function to refresh relationships after status changes
  const refreshRelationships = useCallback(async () => {
    // Clear selected relationship if it's no longer active
    if (selectedRelationship) {
      setSelectedRelationship(null);
      setDocuments([]);
    }
    await fetchRelationships();
  }, [fetchRelationships, selectedRelationship]);
  
  useEffect(() => {
    if (userId) {
      fetchRelationships();
    }
  }, [userId, fetchRelationships]);
  
  return {
    ownerRelationships,
    renterRelationships,
    selectedRelationship,
    documents,
    loading,
    fetchRelationships,
    handleRelationshipSelect,
    handleDocumentUploaded,
    handleBack,
    refreshRelationships
  };
};
