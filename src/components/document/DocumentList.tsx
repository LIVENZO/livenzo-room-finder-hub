
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { File, Check, X } from 'lucide-react';
import { updateDocumentStatus, type Document } from '@/services/DocumentService';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

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
        // If it's already a full URL, open it appropriately
        if (Capacitor.isNativePlatform()) {
          await Browser.open({ url: filePath, presentationStyle: 'popover' });
        } else {
          window.open(filePath, '_blank');
        }
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
      
      // Open the document based on platform
      if (Capacitor.isNativePlatform()) {
        // Mobile app: use Capacitor Browser plugin for in-app viewing
        await Browser.open({ 
          url: data.signedUrl, 
          presentationStyle: 'popover' // Shows as overlay on iOS, fullscreen on Android
        });
      } else {
        // Web browser: open in new tab
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to open document");
    }
  };
  
  return (
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
  );
};

export default DocumentList;
