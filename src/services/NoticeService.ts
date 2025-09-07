
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
