
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DocumentUpload 
        userId={currentUserId} 
        relationshipId={relationshipId}
        onDocumentUploaded={onDocumentUploaded}
      />
      <DocumentList 
        documents={documents}
        isOwner={false}
        onDocumentStatusChanged={onDocumentStatusChanged}
      />
    </div>
  );
};

export default DocumentsTab;
