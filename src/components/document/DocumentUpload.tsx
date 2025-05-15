
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadDocument, type DocumentType } from '@/services/DocumentService';
import { Paperclip, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadProps {
  userId: string;
  relationshipId: string;
  onDocumentUploaded?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ userId, relationshipId, onDocumentUploaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('id_proof');
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    
    setIsUploading(true);
    
    try {
      await uploadDocument(selectedFile, userId, relationshipId, documentType);
      setSelectedFile(null);
      onDocumentUploaded?.();
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const clearSelectedFile = () => {
    setSelectedFile(null);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Upload Documents</CardTitle>
        <CardDescription>
          Upload identification and other required documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="document-type">Document Type</Label>
          <Select 
            value={documentType}
            onValueChange={(value) => setDocumentType(value as DocumentType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id_proof">ID Proof</SelectItem>
              <SelectItem value="income_proof">Income Proof</SelectItem>
              <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
              <SelectItem value="reference">Reference</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="document-file">Document File</Label>
          {selectedFile ? (
            <div className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={clearSelectedFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-sm text-gray-600">Click to select a file</span>
                <Input 
                  id="document-file"
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!selectedFile || isUploading}
          onClick={handleUpload}
        >
          {isUploading ? "Uploading..." : "Upload Document"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentUpload;
