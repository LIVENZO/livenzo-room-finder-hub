
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Complaint {
  id: string;
  relationship_id: string;
  renter_id: string;
  owner_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  response?: string;
  created_at: string;
  updated_at: string;
}

// Submit a new complaint (renters only)
export const submitComplaint = async (
  relationshipId: string,
  ownerId: string,
  title: string,
  description: string
): Promise<Complaint | null> => {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to submit complaints");
      return null;
    }

    const { data, error } = await supabase
      .from("complaints")
      .insert({
        relationship_id: relationshipId,
        renter_id: session.user.id,
        owner_id: ownerId,
        title,
        description,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting complaint:", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      });
      toast.error(`Failed to submit complaint: ${(error as any)?.message || 'Unknown error'}`);
      return null;
    }

    toast.success("Complaint submitted successfully");
    return data as Complaint;
  } catch (error: any) {
    console.error("Exception submitting complaint:", { message: error?.message, stack: error?.stack });
    toast.error("Failed to submit complaint");
    return null;
  }
};

// Fetch complaints for a relationship
export const fetchComplaintsForRelationship = async (relationshipId: string): Promise<Complaint[]> => {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No authenticated session found");
      toast.error("Please log in to view complaints");
      return [];
    }

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("relationship_id", relationshipId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching complaints:", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      });
      toast.error(`Failed to load complaints: ${(error as any)?.message || 'Unknown error'}`);
      return [];
    }

    return data as Complaint[];
  } catch (error: any) {
    console.error("Exception fetching complaints:", { message: error?.message, stack: error?.stack });
    toast.error("Failed to load complaints");
    return [];
  }
};

// Update complaint status and add response (owners only)
export const updateComplaintResponse = async (
  complaintId: string,
  response: string,
  status: 'pending' | 'in_progress' | 'resolved' = 'in_progress'
): Promise<Complaint | null> => {
  try {
    const { data, error } = await supabase
      .from("complaints")
      .update({ 
        response,
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", complaintId)
      .select()
      .single();

    if (error) {
      console.error("Error updating complaint:", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      });
      toast.error(`Failed to update complaint: ${(error as any)?.message || 'Unknown error'}`);
      return null;
    }

    toast.success("Response sent successfully");
    return data as Complaint;
  } catch (error: any) {
    console.error("Exception updating complaint:", { message: error?.message, stack: error?.stack });
    toast.error("Failed to update complaint");
    return null;
  }
};

// Update complaint status only (owners only)
export const updateComplaintStatus = async (
  complaintId: string,
  status: 'pending' | 'in_progress' | 'resolved'
): Promise<Complaint | null> => {
  try {
    const { data, error } = await supabase
      .from("complaints")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", complaintId)
      .select()
      .single();

    if (error) {
      console.error("Error updating complaint status:", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      });
      toast.error(`Failed to update complaint status: ${(error as any)?.message || 'Unknown error'}`);
      return null;
    }

    toast.success("Complaint status updated");
    return data as Complaint;
  } catch (error: any) {
    console.error("Exception updating complaint status:", { message: error?.message, stack: error?.stack });
    toast.error("Failed to update complaint status");
    return null;
  }
};
