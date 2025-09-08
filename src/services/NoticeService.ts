
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Supabase REST details (public anon key is safe to use in frontend)
const SUPABASE_URL = "https://naoqigivttgpkfwpzcgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3FpZ2l2dHRncGtmd3B6Y2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTQwODIsImV4cCI6MjA2MDk3MDA4Mn0.dd6J5jxbWCRfs7z2C5idDu4z0J6ihnXCnK8d0g7noqw";

export interface Notice {
  id: string;
  owner_id: string;
  renter_id: string;
  message: string;
  created_at: string;
}

// Fetch notices for the current renter
export const fetchRenterNotices = async (): Promise<Notice[]> => {
  try {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notices:", error);
      return [];
    }

    return data as Notice[];
  } catch (error) {
    console.error("Exception fetching notices:", error);
    return [];
  }
};

// Fetch all active connections for an owner
export const fetchOwnerConnections = async (ownerId: string): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetOwnerId = user?.id ?? ownerId;

    const { data, error } = await supabase
      .from("relationships")
      .select("renter_id")
      .eq("owner_id", targetOwnerId)
      .eq("status", "accepted");

    if (error) {
      console.error("Error fetching connections:", error);
      return [];
    }

    return (data || []).map((connection: any) => connection.renter_id);
  } catch (error) {
    console.error("Exception fetching connections:", error);
    return [];
  }
};

// Send a notice to all connected renters
export const sendNoticeToAllRenters = async (
  ownerId: string,
  message: string
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to send notices");
      return false;
    }

    // Get all connected renters for the authenticated owner
    const renterIds = await fetchOwnerConnections(user.id);
    
    if (renterIds.length === 0) {
      toast.error("No connected renters found");
      return false;
    }

    // Create notice records for each renter
    const notices = renterIds.map((renterId: string) => ({
      owner_id: user.id,
      renter_id: renterId,
      message
    }));

    const { error } = await supabase.from("notices").insert(notices);

    if (error) {
      console.error("Error sending notices:", error);
      toast.error("Failed to send notices");
      return false;
    }

    toast.success(`Notice sent to ${renterIds.length} renters`);
    return true;
  } catch (error) {
    console.error("Exception sending notices:", error);
    toast.error("Failed to send notices");
    return false;
  }
};

// Send a single notice to a specific renter using REST API (explicit headers and body)
export const sendNoticeToRenter = async (
  ownerId: string,
  renterId: string,
  message: string
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in to send notices");
      return false;
    }

    const { data, error } = await supabase.rpc('create_owner_notice', {
      p_renter_id: renterId,
      p_message: message,
      p_title: null
    });

    if (error) {
      console.error('Failed to send notice via RPC:', error);
      toast.error(`Failed to send notice: ${error.message || 'Unknown error'}`);
      return false;
    }

    toast.success('Notice sent successfully!');
    return true;
  } catch (error: any) {
    console.error('Exception sending single notice:', { message: error?.message, stack: error?.stack });
    toast.error('Failed to send notice. Please try again.');
    return false;
  }
};
