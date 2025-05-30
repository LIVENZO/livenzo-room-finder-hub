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
    
    // Check if there's already a relationship between these users
    const { data: existingRelationships, error: checkError } = await supabase
      .from("relationships")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("renter_id", renterId);
      
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
        chat_room_id: chatRoomId
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating relationship:", error);
      // Handle the specific duplicate key error
      if (error.code === '23505' && error.message.includes('relationships_owner_id_renter_id_key')) {
        toast.error("A connection request with this owner already exists");
      } else {
        toast.error("Failed to send connection request");
      }
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

// Update relationship status (owner accepting/declining)
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
