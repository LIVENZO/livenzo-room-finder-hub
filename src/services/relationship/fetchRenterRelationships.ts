
import { supabase } from "@/integrations/supabase/client";
import { Relationship } from "@/types/relationship";

export const fetchRenterRelationships = async (userId: string): Promise<Relationship[]> => {
  try {
    console.log("Fetching renter relationships for user:", userId);
    
    // Use the new function to get only active (non-archived) relationships
    const { data, error } = await supabase.rpc('get_active_renter_relationships', {
      renter_user_id: userId
    });

    if (error) {
      console.error("Error fetching renter relationships:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("No active relationships found for renter:", userId);
      return [];
    }

    // Fetch owner profiles for each relationship
    const ownerIds = data.map((rel: any) => rel.owner_id);
    const { data: ownerProfiles, error: ownerError } = await supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .in("id", ownerIds);

    if (ownerError) {
      console.error("Error fetching owner profiles:", ownerError);
      // Continue without owner profiles rather than failing completely
    }

    // Map relationships with owner data
    const relationshipsWithOwners = data.map((rel: any) => {
      const ownerProfile = ownerProfiles?.find(owner => owner.id === rel.owner_id);
      return {
        ...rel,
        owner: ownerProfile ? {
          full_name: ownerProfile.full_name,
          avatar_url: ownerProfile.avatar_url
        } : null
      } as Relationship;
    });

    console.log("Fetched renter relationships with owners:", relationshipsWithOwners);
    return relationshipsWithOwners;
  } catch (error) {
    console.error("Exception fetching renter relationships:", error);
    throw error;
  }
};

// Function to fetch archived relationships for "Previous Connections" section
export const fetchArchivedRenterRelationships = async (userId: string): Promise<Relationship[]> => {
  try {
    console.log("Fetching archived renter relationships for user:", userId);
    
    const { data, error } = await supabase
      .from("relationships")
      .select(`
        id,
        owner_id,
        renter_id,
        status,
        chat_room_id,
        created_at,
        updated_at,
        archived
      `)
      .eq("renter_id", userId)
      .eq("archived", true)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching archived relationships:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("No archived relationships found for renter:", userId);
      return [];
    }

    // Fetch owner profiles for archived relationships
    const ownerIds = data.map(rel => rel.owner_id);
    const { data: ownerProfiles, error: ownerError } = await supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .in("id", ownerIds);

    if (ownerError) {
      console.error("Error fetching owner profiles for archived relationships:", ownerError);
    }

    // Map archived relationships with owner data
    const archivedRelationshipsWithOwners = data.map(rel => {
      const ownerProfile = ownerProfiles?.find(owner => owner.id === rel.owner_id);
      return {
        ...rel,
        owner: ownerProfile ? {
          full_name: ownerProfile.full_name,
          avatar_url: ownerProfile.avatar_url
        } : null
      } as Relationship;
    });

    console.log("Fetched archived relationships:", archivedRelationshipsWithOwners);
    return archivedRelationshipsWithOwners;
  } catch (error) {
    console.error("Exception fetching archived relationships:", error);
    throw error;
  }
};
