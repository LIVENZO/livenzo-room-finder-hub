
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { File, Check, X, Download } from 'lucide-react';
import { updateDocumentStatus, type Document } from '@/services/DocumentService';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentListProps {
  documents: Document[];
  isOwner: boolean;
  onDocumentStatusChanged?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, isOwner, onDocumentStatusChanged }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentDocUrl, setCurrentDocUrl] = useState('');
  const [currentDocName, setCurrentDocName] = useState('');
  const [currentDocType, setCurrentDocType] = useState('');

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
  
  const viewDocument = async (document: Document) => {
    try {
      console.log('Attempting to view document:', document.file_path);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to view documents");
        return;
      }
      
      // Extract the file path for signed URL generation
      let filePath = document.file_path;
      
      // Handle different file path formats
      if (filePath.includes('/storage/v1/object/public/documents/')) {
        filePath = filePath.split('/documents/')[1];
      } else if (filePath.includes('documents/')) {
        filePath = filePath.replace('documents/', '');
      } else if (filePath.startsWith('http')) {
        // If it's already a full URL, open in viewer
        setCurrentDocUrl(filePath);
        setCurrentDocName(document.file_name);
        setCurrentDocType(document.file_type);
        setViewerOpen(true);
        return;
      }
      
      if (!filePath) {
        toast.error("Invalid document path");
        return;
      }
      
      console.log('Using file path for signed URL:', filePath);
      
      // Get a signed URL for the document with longer expiry
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 7200); // 2 hours expiry
      
      if (error) {
        console.error("Error creating signed URL:", error);
        toast.error(`Failed to access document: ${error.message}`);
        return;
      }
      
      if (!data?.signedUrl) {
        toast.error("Could not generate access URL for document");
        return;
      }
      
      console.log('Opening signed URL:', data.signedUrl);
      
      // Open in in-app viewer
      setCurrentDocUrl(data.signedUrl);
      setCurrentDocName(document.file_name);
      setCurrentDocType(document.file_type);
      setViewerOpen(true);
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to open document");
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const canPreview = (fileType: string, filename: string) => {
    const ext = getFileExtension(filename);
    return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) ||
           fileType.startsWith('image/') || 
           fileType === 'application/pdf';
  };
  
  return (
    <>
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{currentDocName}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentDocUrl, '_blank')}
                className="ml-4 flex-shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {canPreview(currentDocType, currentDocName) ? (
              getFileExtension(currentDocName) === 'pdf' || currentDocType === 'application/pdf' ? (
                <iframe
                  src={currentDocUrl}
                  className="w-full h-full border-0"
                  title={currentDocName}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted p-4">
                  <img
                    src={currentDocUrl}
                    alt={currentDocName}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                <File className="h-16 w-16 text-muted-foreground" />
                <p className="text-lg font-medium">Preview not available</p>
                <p className="text-sm text-muted-foreground">
                  This file type cannot be previewed in the app.
                </p>
                <Button onClick={() => window.open(currentDocUrl, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download to view
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="w-full">
        <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Documents</CardTitle>
          <CardDescription>
            Manage uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {documents.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No documents have been uploaded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="border rounded-lg p-4 bg-card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <File className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {document.file_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {getDocumentTypeLabel(document.document_type)}
                          </Badge>
                          {getStatusBadge(document.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Uploaded on {format(new Date(document.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewDocument(document)}
                        className="text-sm"
                      >
                        View
                      </Button>
                      
                      {isOwner && document.status === 'submitted' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
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
                    <div className="mt-4 text-sm bg-muted/50 p-3 rounded-md">
                      <p className="font-medium mb-1">Comments:</p>
                      <p className="text-muted-foreground">{document.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default DocumentList;
