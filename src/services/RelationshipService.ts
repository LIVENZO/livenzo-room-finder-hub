
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export interface Relationship {
  id: string;
  owner_id: string;
  renter_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  chat_room_id: string;
  owner?: {
    full_name: string;
    avatar_url: string;
  };
  renter?: {
    full_name: string;
    avatar_url: string;
  };
}

// Fetch a specific relationship by ID
export const fetchRelationship = async (relationshipId: string): Promise<Relationship | null> => {
  try {
    const { data, error } = await supabase
      .from("relationships")
      .select("*")
      .eq("id", relationshipId)
      .single();

    if (error) {
      console.error("Error fetching relationship:", error);
      return null;
    }

    return data as Relationship;
  } catch (error) {
    console.error("Exception fetching relationship:", error);
    return null;
  }
};

// Fetch relationships where current user is owner
export const fetchOwnerRelationships = async (userId: string): Promise<Relationship[]> => {
  try {
    const { data, error } = await supabase
      .from("relationships")
      .select(`
        *,
        renter:profiles!renter_id(full_name, avatar_url)
      `)
      .eq("owner_id", userId);

    if (error) {
      console.error("Error fetching owner relationships:", error);
      return [];
    }

    return data.map(item => ({
      ...item,
      renter: {
        full_name: item.renter?.full_name || 'Unknown User',
        avatar_url: item.renter?.avatar_url || '',
      }
    })) as Relationship[];
  } catch (error) {
    console.error("Exception fetching owner relationships:", error);
    return [];
  }
};

// Fetch relationships where current user is renter
export const fetchRenterRelationships = async (userId: string): Promise<Relationship[]> => {
  try {
    const { data, error } = await supabase
      .from("relationships")
      .select(`
        *,
        owner:profiles!owner_id(full_name, avatar_url)
      `)
      .eq("renter_id", userId);

    if (error) {
      console.error("Error fetching renter relationships:", error);
      return [];
    }

    return data.map(item => ({
      ...item,
      owner: {
        full_name: item.owner?.full_name || 'Unknown User',
        avatar_url: item.owner?.avatar_url || '',
      }
    })) as Relationship[];
  } catch (error) {
    console.error("Exception fetching renter relationships:", error);
    return [];
  }
};

// Create a new relationship request (renter to owner)
export const createRelationshipRequest = async (
  ownerId: string,
  renterId: string
): Promise<Relationship | null> => {
  try {
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
      if (error.code === '23505') {
        toast.error("You already have a relationship with this owner");
      } else {
        toast.error("Failed to send connection request");
        console.error("Error creating relationship:", error);
      }
      return null;
    }

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

// Search for a user by ID
export const findUserById = async (userId: string): Promise<{id: string, full_name: string, avatar_url: string} | null> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error finding user:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception finding user:", error);
    return null;
  }
};
