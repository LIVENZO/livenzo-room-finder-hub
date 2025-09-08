
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Supabase REST details (public anon key is safe to use in frontend)
const SUPABASE_URL = "https://naoqigivttgpkfwpzcgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3FpZ2l2dHRncGtmd3B6Y2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTQwODIsImV4cCI6MjA2MDk3MDA4Mn0.dd6J5jxbWCRfs7z2C5idDu4z0J6ihnXCnK8d0g7noqw";

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

    const payload = {
      relationship_id: relationshipId,
      renter_id: session.user.id,
      owner_id: ownerId,
      title,
      description,
      status: 'pending' as const,
    };

    console.debug("Submitting complaint payload:", payload);

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (resp.status !== 201) {
      const errText = await resp.text();
      console.error("Failed to submit complaint:", { status: resp.status, statusText: resp.statusText, body: errText, payload });
      toast.error("Failed to submit complaint");
      return null;
    }

    const json = await resp.json().catch(() => null);
    const created = Array.isArray(json) ? json[0] : json;

    toast.success("Complaint submitted successfully");
    return created as Complaint;
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
