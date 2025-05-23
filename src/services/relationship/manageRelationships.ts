
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
    
    // Check if a relationship already exists between these users
    const { data: existingRelationships, error: checkError } = await supabase
      .from("relationships")
      .select("*")
      .or(`owner_id.eq.${ownerId},renter_id.eq.${renterId}`)
      .or(`owner_id.eq.${renterId},renter_id.eq.${ownerId}`);
      
    if (checkError) {
      console.error("Error checking existing relationship:", checkError);
      toast.error("Failed to check existing relationships");
      return null;
    }
    
    if (existingRelationships && existingRelationships.length > 0) {
      console.log("Existing relationship found:", existingRelationships);
      toast.error("You already have a relationship with this owner");
      return null;
    }
    
    console.log("Creating relationship request from renter:", renterId, "to owner:", ownerId);
    
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
      toast.error("Failed to send connection request");
      console.error("Error creating relationship:", error);
      return null;
    }

    console.log("Relationship request created successfully:", data);
    toast.success("Connection request sent successfully");
    return data as Relationship;
  } catch (error) {
    toast.error("Failed to send connection request");
    console.error("Exception creating relationship:", error);
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
