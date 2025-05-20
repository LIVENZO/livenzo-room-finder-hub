
import { supabase } from "@/integrations/supabase/client";
import { Relationship } from "@/types/relationship";

// Fetch relationships where current user is renter
export const fetchRenterRelationships = async (userId: string): Promise<Relationship[]> => {
  try {
    // First, fetch the relationships
    const { data: relationshipsData, error: relationshipsError } = await supabase
      .from("relationships")
      .select("*")
      .eq("renter_id", userId);
    
    if (relationshipsError) {
      console.error("Error fetching renter relationships:", relationshipsError);
      return [];
    }
    
    console.log("Renter relationships fetched:", relationshipsData?.length || 0);
    
    // Then fetch the profiles separately and join them manually
    const relationships = relationshipsData as Relationship[];
    const enrichedRelationships = await Promise.all(
      relationships.map(async (relationship) => {
        // Fetch owner profile
        const { data: ownerProfile } = await supabase
          .from("user_profiles")
          .select("full_name, avatar_url")
          .eq("id", relationship.owner_id)
          .single();
          
        return {
          ...relationship,
          owner: {
            full_name: ownerProfile?.full_name || 'Unknown User',
            avatar_url: ownerProfile?.avatar_url || '',
          }
        };
      })
    );

    return enrichedRelationships;
  } catch (error) {
    console.error("Exception fetching renter relationships:", error);
    return [];
  }
};
