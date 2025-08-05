
import React from 'react';
import DocumentUpload from '@/components/document/DocumentUpload';
import DocumentList from '@/components/document/DocumentList';
import { Document } from '@/services/DocumentService';

interface DocumentsTabProps {
  currentUserId: string;
  relationshipId: string;
  documents: Document[];
  onDocumentUploaded: () => void;
  onDocumentStatusChanged: () => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
  currentUserId,
  relationshipId,
  documents,
  onDocumentUploaded,
  onDocumentStatusChanged
}) => {
  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-4xl mx-auto">
        <DocumentUpload 
          userId={currentUserId} 
          relationshipId={relationshipId}
          onDocumentUploaded={onDocumentUploaded}
        />
      </div>
      <div className="max-w-4xl mx-auto">
        <DocumentList 
          documents={documents}
          isOwner={false}
          onDocumentStatusChanged={onDocumentStatusChanged}
        />
      </div>
    </div>
  );
};

export default DocumentsTab;
