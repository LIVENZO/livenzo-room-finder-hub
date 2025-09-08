
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFilesSecure } from "./storage/secureStorage";
import { validateAuthentication, validateUserPermission } from "./security/authValidator";
import { validateText, validateUserId } from "./security/inputValidator";

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
    
    // Validate inputs
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.isValid) {
      toast.error("Invalid user ID");
      return null;
    }
    
    const relationshipIdValidation = validateUserId(relationshipId);
    if (!relationshipIdValidation.isValid) {
      toast.error("Invalid relationship ID");
      return null;
    }
    
    // Check authentication
    const authResult = await validateAuthentication();
    if (!authResult.isValid || authResult.userId !== userId) {
      toast.error("Authentication failed. Please log in again.");
      return null;
    }
    
    // Validate user permission for this relationship
    const hasPermission = await validateUserPermission(
      userId, 
      'write', 
      'relationship', 
      relationshipId
    );
    
    if (!hasPermission) {
      toast.error("You don't have permission to upload documents to this relationship");
      return null;
    }
    
    // Upload the file to storage using 'documents' bucket and document file type
    const fileUrls = await uploadFilesSecure([file], userId, 'documents', 'document');
    
    if (!fileUrls.length) {
      toast.error("Failed to upload document to storage");
      return null;
    }
    
    const filePath = fileUrls[0];
    console.log('File uploaded to storage:', filePath);
    
    // Create a document record in the database
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
      console.error("Error creating document record:", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      });
      toast.error(`Failed to record document in database: ${(error as any)?.message || 'Unknown error'}`);
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
    // Validate input
    const relationshipIdValidation = validateUserId(relationshipId);
    if (!relationshipIdValidation.isValid) {
      console.error("Invalid relationship ID format");
      toast.error("Invalid relationship ID");
      return [];
    }
    
    // Check authentication
    const authResult = await validateAuthentication();
    if (!authResult.isValid) {
      console.error("No authenticated session found");
      toast.error("Please log in to view documents");
      return [];
    }
    
    // Check if user can access this relationship (owner or renter)
    const { data: relationship } = await supabase
      .from('relationships')
      .select('owner_id, renter_id')
      .eq('id', relationshipId)
      .single();
    
    const hasPermission = relationship && 
      (relationship.owner_id === authResult.userId || relationship.renter_id === authResult.userId);
    
    if (!hasPermission) {
      console.error("User doesn't have permission to view documents for this relationship");
      toast.error("You don't have permission to view these documents");
      return [];
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("relationship_id", relationshipId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
      return [];
    }

    return data as Document[];
  } catch (error) {
    console.error("Exception fetching documents:", error);
    toast.error("Failed to load documents");
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
    // Validate inputs
    const documentIdValidation = validateUserId(documentId);
    if (!documentIdValidation.isValid) {
      toast.error("Invalid document ID");
      return null;
    }
    
    if (comments) {
      const commentsValidation = validateText(comments, 0, 500);
      if (!commentsValidation.isValid) {
        toast.error(commentsValidation.error || "Invalid comments");
        return null;
      }
      comments = commentsValidation.sanitizedValue;
    }
    
    // Check authentication
    const authResult = await validateAuthentication();
    if (!authResult.isValid) {
      toast.error("Please log in to update document status");
      return null;
    }
    
    // Validate user permission for this document
    const hasPermission = await validateUserPermission(
      authResult.userId!, 
      'write', 
      'document', 
      documentId
    );
    
    if (!hasPermission) {
      toast.error("You don't have permission to update this document");
      return null;
    }

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
