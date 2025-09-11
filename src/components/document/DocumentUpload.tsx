import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadDocument, type DocumentType } from '@/services/DocumentService';
import { validateDocumentFile } from '@/services/security/fileUploadSecurity';
import { Paperclip, Upload, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
interface DocumentUploadProps {
  userId: string;
  relationshipId: string;
  onDocumentUploaded?: () => void;
}
const DocumentUpload: React.FC<DocumentUploadProps> = ({
  userId,
  relationshipId,
  onDocumentUploaded
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('id_proof');
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file security
      const validation = validateDocumentFile(file);
      if (!validation.isValid) {
        setFileError(validation.error || 'Invalid file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    if (fileError) {
      toast.error("Please select a valid file");
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
    setFileError(null);
  };
  return <Card>
      <CardHeader>
        <CardTitle className="text-xl">Upload Documents</CardTitle>
        
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="document-type">Document Type</Label>
          <Select value={documentType} onValueChange={value => setDocumentType(value as DocumentType)}>
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
          {selectedFile ? <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={clearSelectedFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {fileError && <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {fileError}
                </div>}
            </div> : <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6">
              <label htmlFor="document-file" className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-sm text-gray-600">Click to select a file</span>
                <span className="text-xs text-gray-500">PDF, JPEG, PNG only (max 5MB)</span>
              </label>
              <Input ref={fileInputRef} id="document-file" type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
            </div>}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={!selectedFile || isUploading || !!fileError} onClick={handleUpload}>
          {isUploading ? "Uploading..." : "Upload Document"}
        </Button>
      </CardFooter>
    </Card>;
};
export default DocumentUpload;