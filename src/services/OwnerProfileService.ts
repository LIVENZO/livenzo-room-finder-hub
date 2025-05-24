
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/services/UserProfileService";

export const fetchOwnerProfileForRenter = async (
  ownerId: string, 
  renterId: string
): Promise<UserProfile | null> => {
  try {
    // First verify that the renter has an active relationship with this owner
    const { data: relationship, error: relationshipError } = await supabase
      .from("relationships")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("renter_id", renterId)
      .eq("status", "accepted")
      .single();

    if (relationshipError || !relationship) {
      console.error("No active relationship found:", relationshipError);
      return null;
    }

    // If relationship exists, fetch the owner's profile
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", ownerId)
      .single();

    if (error) {
      console.error("Error fetching owner profile:", error);
      return null;
    }

    // Type cast the accommodation_type and resident_type to ensure compatibility
    return {
      ...data,
      accommodation_type: data.accommodation_type as 'PG' | 'Hostel' | null,
      resident_type: data.resident_type as 'Boys' | 'Girls' | 'Both' | null,
    } as UserProfile;
  } catch (error) {
    console.error("Exception fetching owner profile:", error);
    return null;
  }
};
