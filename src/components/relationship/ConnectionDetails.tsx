
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocumentUpload from '@/components/document/DocumentUpload';
import DocumentList from '@/components/document/DocumentList';
import { Relationship } from '@/types/relationship';
import { Document } from '@/services/DocumentService';

interface ConnectionDetailsProps {
  selectedRelationship: Relationship;
  isOwner: boolean;
  documents: Document[];
  onDocumentUploaded: () => Promise<void>;
  onBackClick: () => void;
}

const ConnectionDetails: React.FC<ConnectionDetailsProps> = ({
  selectedRelationship,
  isOwner,
  documents,
  onDocumentUploaded,
  onBackClick,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('documents');

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          {isOwner 
            ? `Connection with ${selectedRelationship.renter?.full_name}` 
            : `Connection with ${selectedRelationship.owner?.full_name}`}
        </h2>
        <button 
          className="text-sm text-blue-600 hover:underline"
          onClick={onBackClick}
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
                userId={selectedRelationship.renter_id} 
                relationshipId={selectedRelationship.id}
                onDocumentUploaded={onDocumentUploaded}
              />
            )}
            <DocumentList 
              documents={documents}
              isOwner={isOwner}
              onDocumentStatusChanged={onDocumentUploaded}
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
  );
};

export default ConnectionDetails;
