
import React, { useState, useEffect, useContext } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserSearch from '@/components/relationship/UserSearch';
import RelationshipList from '@/components/relationship/RelationshipList';
import DocumentUpload from '@/components/document/DocumentUpload';
import DocumentList from '@/components/document/DocumentList';
import { 
  fetchOwnerRelationships, 
  fetchRenterRelationships, 
  type Relationship 
} from '@/services/RelationshipService';
import { fetchDocumentsForRelationship, type Document } from '@/services/DocumentService';
import { AuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';

const Connections = () => {
  const { currentUser, isOwner } = useContext(AuthContext);
  const navigate = useNavigate();
  const { relationshipId } = useParams<{ relationshipId: string }>();
  
  const [ownerRelationships, setOwnerRelationships] = useState<Relationship[]>([]);
  const [renterRelationships, setRenterRelationships] = useState<Relationship[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(false);
  
  const fetchRelationships = async () => {
    if (!currentUser?.id) {
      toast.error("Please login to manage connections");
      navigate('/');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Fetching relationships for user:", currentUser.id, "isOwner:", isOwner);
      
      let owner: Relationship[] = [];
      let renter: Relationship[] = [];
      
      if (isOwner) {
        owner = await fetchOwnerRelationships(currentUser.id);
        console.log("Owner relationships:", owner);
      } else {
        renter = await fetchRenterRelationships(currentUser.id);
        console.log("Renter relationships:", renter);
      }
      
      setOwnerRelationships(owner);
      setRenterRelationships(renter);
      
      // If relationship ID is provided, select that relationship
      if (relationshipId) {
        const relationship = [...owner, ...renter].find(r => r.id === relationshipId);
        if (relationship) {
          setSelectedRelationship(relationship);
          setActiveTab('documents');
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
  
  useEffect(() => {
    if (currentUser?.id) {
      fetchRelationships();
    }
  }, [currentUser, isOwner]);
  
  useEffect(() => {
    if (relationshipId && currentUser?.id) {
      fetchRelationships();
    }
  }, [relationshipId]);
  
  const handleRelationshipSelect = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setActiveTab('documents');
    loadDocuments(relationship.id);
  };
  
  const handleDocumentUploaded = async () => {
    if (selectedRelationship) {
      await loadDocuments(selectedRelationship.id);
    }
  };
  
  if (!currentUser?.id) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center p-8">
            <p className="text-lg">Please login to manage connections</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-gray-500">Manage your owner-renter relationships and documents</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {!selectedRelationship ? (
            <>
              {!isOwner && (
                <div className="mb-6">
                  <UserSearch currentUserId={currentUser.id} />
                </div>
              )}
              
              <RelationshipList
                ownerRelationships={ownerRelationships}
                renterRelationships={renterRelationships}
                onStatusChange={fetchRelationships}
                isOwner={isOwner}
                isLoading={loading}
              />
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">
                  {isOwner 
                    ? `Connection with ${selectedRelationship.renter?.full_name}` 
                    : `Connection with ${selectedRelationship.owner?.full_name}`}
                </h2>
                <button 
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => {
                    setSelectedRelationship(null);
                    setDocuments([]);
                  }}
                >
                  Back to all connections
                </button>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>
                
                <TabsContent value="documents">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {!isOwner && (
                      <DocumentUpload 
                        userId={currentUser.id} 
                        relationshipId={selectedRelationship.id}
                        onDocumentUploaded={handleDocumentUploaded}
                      />
                    )}
                    <DocumentList 
                      documents={documents}
                      isOwner={isOwner}
                      onDocumentStatusChanged={handleDocumentUploaded}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="chat">
                  <div className="text-center py-8">
                    <p>
                      Chat is available in the dedicated chat section.
                    </p>
                    <button
                      className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      onClick={() => navigate(`/chats/${selectedRelationship.chat_room_id}`)}
                    >
                      Go to Chat
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Connections;
