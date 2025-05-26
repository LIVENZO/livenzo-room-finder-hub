import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadImagesToStorage } from "./storage/supabaseStorage";

export type DocumentType = 'id_proof' | 'income_proof' | 'lease_agreement' | 'reference';

export interface Document {
  id: string;
  relationship_id: string;
  user_id: string;
  document_type: DocumentType;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: 'submitted' | 'approved' | 'rejected';
  comments?: string;
  created_at: string;
  updated_at: string;
}

// Upload a document to storage and create DB record
export const uploadDocument = async (
  file: File,
  userId: string,
  relationshipId: string,
  documentType: DocumentType
): Promise<Document | null> => {
  try {
    console.log('Starting document upload:', { fileName: file.name, documentType, userId, relationshipId });
    
    // First, upload the file to storage - use 'documents' bucket
    const fileUrls = await uploadImagesToStorage([file], userId, 'documents');
    
    if (!fileUrls.length) {
      toast.error("Failed to upload document to storage");
      return null;
    }
    
    const filePath = fileUrls[0];
    console.log('File uploaded to storage:', filePath);
    
    // Then create a document record in the database
    const { data, error } = await supabase
      .from("documents")
      .insert({
        relationship_id: relationshipId,
        user_id: userId,
        document_type: documentType,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        status: 'submitted'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document record:", error);
      toast.error("Failed to record document in database");
      return null;
    }

    console.log('Document record created:', data);
    toast.success("Document uploaded successfully");
    return data as Document;
  } catch (error) {
    console.error("Exception uploading document:", error);
    toast.error("Failed to upload document");
    return null;
  }
};

// Fetch documents for a relationship
export const fetchDocumentsForRelationship = async (relationshipId: string): Promise<Document[]> => {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("relationship_id", relationshipId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return [];
    }

    return data as Document[];
  } catch (error) {
    console.error("Exception fetching documents:", error);
    return [];
  }
};

// Update document status (approve/reject)
export const updateDocumentStatus = async (
  documentId: string,
  status: 'approved' | 'rejected',
  comments?: string
): Promise<Document | null> => {
  try {
    const { data, error } = await supabase
      .from("documents")
      .update({ 
        status,
        comments: comments || null
      })
      .eq("id", documentId)
      .select()
      .single();

    if (error) {
      toast.error(`Failed to ${status} document`);
      console.error("Error updating document:", error);
      return null;
    }

    toast.success(`Document ${status} successfully`);
    return data as Document;
  } catch (error) {
    toast.error(`Failed to ${status} document`);
    console.error("Exception updating document:", error);
    return null;
  }
};
