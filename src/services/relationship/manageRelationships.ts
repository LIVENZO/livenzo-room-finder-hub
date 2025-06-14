
import { supabase } from "@/integrations/supabase/client";
import { Relationship } from "@/types/relationship";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { isProfileComplete } from "@/utils/profileUtils";
import { fetchUserProfile } from "@/services/UserProfileService";

// Create a new relationship request (renter to owner)
export const createRelationshipRequest = async (
  ownerId: string,
  renterId: string
): Promise<Relationship | null> => {
  try {
    // First, check if renter profile is complete
    const renterProfile = await fetchUserProfile(renterId);
    if (!isProfileComplete(renterProfile)) {
      toast.error("Please complete your profile before sending a connection request");
      return null;
    }
    
    // Check if renter already has an active (accepted) connection with any owner
    const { data: activeConnections, error: activeCheckError } = await supabase
      .from("relationships")
      .select("*")
      .eq("renter_id", renterId)
      .eq("status", "accepted")
      .eq("archived", false);
      
    if (activeCheckError) {
      console.error("Error checking active connections:", activeCheckError);
      toast.error("Failed to verify connection status");
      return null;
    }
    
    if (activeConnections && activeConnections.length > 0) {
      toast.error("You already have an active connection with an owner. Please disconnect first before connecting to a new owner.");
      return null;
    }
    
    // Check if there's already a relationship between these users
    const { data: existingRelationships, error: checkError } = await supabase
      .from("relationships")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("renter_id", renterId)
      .eq("archived", false); // Only check non-archived relationships
      
    if (checkError) {
      console.error("Error checking existing relationship:", checkError);
      toast.error("Failed to check existing relationships");
      return null;
    }
    
    console.log("Existing relationships found:", existingRelationships);
    
    if (existingRelationships && existingRelationships.length > 0) {
      // Get the most recent relationship
      const latestRelationship = existingRelationships.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      
      console.log("Latest relationship status:", latestRelationship.status);
      
      // Block if there's an active (accepted) or pending relationship
      if (latestRelationship.status === 'accepted') {
        toast.error("You already have an active connection with this owner");
        return null;
      } else if (latestRelationship.status === 'pending') {
        toast.error("You already have a pending request with this owner");
        return null;
      } else if (latestRelationship.status === 'declined') {
        // For declined relationships, update the existing record instead of creating new one
        console.log("Updating existing declined relationship to pending");
        
        const { data: updatedRelationship, error: updateError } = await supabase
          .from("relationships")
          .update({ 
            status: "pending",
            updated_at: new Date().toISOString()
          })
          .eq("id", latestRelationship.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating relationship:", updateError);
          toast.error("Failed to send connection request");
          return null;
        }

        console.log("Relationship updated successfully:", updatedRelationship);
        toast.success("Request sent again to this PG successfully");
        return updatedRelationship as Relationship;
      }
    }
    
    console.log("Creating new relationship request from renter:", renterId, "to owner:", ownerId);
    
    // Generate a unique room ID for chat
    const chatRoomId = uuidv4();
    
    const { data, error } = await supabase
      .from("relationships")
      .insert({
        owner_id: ownerId,
        renter_id: renterId,
        status: "pending",
        chat_room_id: chatRoomId,
        archived: false
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating relationship:", error);
      toast.error("Failed to send connection request");
      return null;
    }

    console.log("Relationship request created successfully:", data);
    toast.success("Connection request sent successfully");
    
    return data as Relationship;
  } catch (error) {
    console.error("Exception creating relationship:", error);
    toast.error("Failed to send connection request");
    return null;
  }
};

// Update relationship status (owner accepting/declining, or renter disconnecting)
export const updateRelationshipStatus = async (
  relationshipId: string,
  status: 'accepted' | 'declined'
): Promise<Relationship | null> => {
  try {
    // If accepting, check if owner profile is complete
    if (status === 'accepted') {
      const { data: relationship } = await supabase
        .from("relationships")
        .select("owner_id")
        .eq("id", relationshipId)
        .single();
      
      if (relationship) {
        const ownerProfile = await fetchUserProfile(relationship.owner_id);
        if (!isProfileComplete(ownerProfile)) {
          toast.error("Please complete your profile before accepting connection requests");
          return null;
        }
      }
    }
    
    const { data, error } = await supabase
      .from("relationships")
      .update({ status })
      .eq("id", relationshipId)
      .select()
      .single();

    if (error) {
      toast.error(`Failed to ${status} connection request`);
      console.error("Error updating relationship:", error);
      return null;
    }

    toast.success(`Connection request ${status}`);
    return data as Relationship;
  } catch (error) {
    toast.error(`Failed to ${status} connection request`);
    console.error("Exception updating relationship:", error);
    return null;
  }
};

// Archive previous connections when renter accepts new connection
export const archivePreviousConnections = async (
  renterId: string,
  newOwnerId: string
): Promise<boolean> => {
  try {
    console.log("Archiving previous connections for renter:", renterId, "new owner:", newOwnerId);
    
    const { error } = await supabase.rpc('archive_previous_connection_data', {
      renter_user_id: renterId,
      new_owner_id: newOwnerId
    });

    if (error) {
      console.error("Error archiving previous connections:", error);
      return false;
    }

    console.log("Previous connections archived successfully");
    return true;
  } catch (error) {
    console.error("Exception archiving previous connections:", error);
    return false;
  }
};

// Function specifically for renter disconnection
export const disconnectFromOwner = async (
  relationshipId: string,
  renterId: string
): Promise<boolean> => {
  try {
    console.log("Renter disconnecting from relationship:", relationshipId, "renter:", renterId);
    
    // First verify the relationship exists and belongs to this renter
    const { data: relationship, error: fetchError } = await supabase
      .from("relationships")
      .select("*")
      .eq("id", relationshipId)
      .eq("renter_id", renterId)
      .single();

    if (fetchError || !relationship) {
      console.error("Error fetching relationship for disconnect:", fetchError);
      toast.error("Relationship not found or unauthorized");
      return false;
    }

    // Update the relationship status to declined
    const { data, error } = await supabase
      .from("relationships")
      .update({ 
        status: "declined",
        updated_at: new Date().toISOString()
      })
      .eq("id", relationshipId)
      .select()
      .single();

    if (error) {
      console.error("Error disconnecting from owner:", error);
      toast.error("Failed to disconnect from owner");
      return false;
    }

    console.log("Successfully disconnected from owner:", data);
    toast.success("Successfully disconnected from your property owner");
    return true;
  } catch (error) {
    console.error("Exception disconnecting from owner:", error);
    toast.error("Failed to disconnect from owner");
    return false;
  }
};
