
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { File, Check, X } from 'lucide-react';
import { updateDocumentStatus, type Document } from '@/services/DocumentService';
import { format } from 'date-fns';

interface DocumentListProps {
  documents: Document[];
  isOwner: boolean;
  onDocumentStatusChanged?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, isOwner, onDocumentStatusChanged }) => {
  const handleApprove = async (documentId: string) => {
    await updateDocumentStatus(documentId, 'approved');
    onDocumentStatusChanged?.();
  };
  
  const handleReject = async (documentId: string) => {
    await updateDocumentStatus(documentId, 'rejected');
    onDocumentStatusChanged?.();
  };
  
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'id_proof': return 'ID Proof';
      case 'income_proof': return 'Income Proof';
      case 'lease_agreement': return 'Lease Agreement';
      case 'reference': return 'Reference';
      default: return type;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Documents</CardTitle>
        <CardDescription>
          Manage uploaded documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No documents have been uploaded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="border rounded-md p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <div>
                      <p className="font-medium truncate max-w-[200px]">
                        {document.file_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getDocumentTypeLabel(document.document_type)}
                        </Badge>
                        {getStatusBadge(document.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={document.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </a>
                    
                    {isOwner && document.status === 'submitted' && (
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8"
                          onClick={() => handleReject(document.id)}
                        >
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                        <Button 
                          size="sm"
                          className="h-8"
                          onClick={() => handleApprove(document.id)}
                        >
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {document.comments && (
                  <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                    <p className="font-medium">Comments:</p>
                    <p className="text-gray-700">{document.comments}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Uploaded on {format(new Date(document.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentList;
