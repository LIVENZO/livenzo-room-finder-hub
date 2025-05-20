
import { useState, useEffect } from 'react';
import { 
  fetchOwnerRelationships, 
  fetchRenterRelationships,
  type Relationship
} from '@/services/relationship';
import { fetchDocumentsForRelationship, type Document } from '@/services/DocumentService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useRelationships = (userId: string | undefined, isOwner: boolean, relationshipId?: string) => {
  const navigate = useNavigate();
  const [ownerRelationships, setOwnerRelationships] = useState<Relationship[]>([]);
  const [renterRelationships, setRenterRelationships] = useState<Relationship[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const fetchRelationships = async () => {
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
        console.log("Owner relationships:", owner);
      } else {
        renter = await fetchRenterRelationships(userId);
        console.log("Renter relationships:", renter);
      }
      
      setOwnerRelationships(owner);
      setRenterRelationships(renter);
      
      // If relationship ID is provided, select that relationship
      if (relationshipId) {
        const relationship = [...owner, ...renter].find(r => r.id === relationshipId);
        if (relationship) {
          setSelectedRelationship(relationship);
          await loadDocuments(relationshipId);
        }
      }
    } catch (error) {
      console.error("Error fetching relationships:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };
  
  const loadDocuments = async (relId: string) => {
    try {
      const docs = await fetchDocumentsForRelationship(relId);
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };
  
  const handleRelationshipSelect = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    loadDocuments(relationship.id);
  };
  
  const handleDocumentUploaded = async () => {
    if (selectedRelationship) {
      await loadDocuments(selectedRelationship.id);
    }
  };

  const handleBack = () => {
    setSelectedRelationship(null);
    setDocuments([]);
  };
  
  useEffect(() => {
    if (userId) {
      fetchRelationships();
    }
  }, [userId, isOwner]);
  
  useEffect(() => {
    if (relationshipId && userId) {
      fetchRelationships();
    }
  }, [relationshipId]);
  
  return {
    ownerRelationships,
    renterRelationships,
    selectedRelationship,
    documents,
    loading,
    fetchRelationships,
    handleRelationshipSelect,
    handleDocumentUploaded,
    handleBack
  };
};
