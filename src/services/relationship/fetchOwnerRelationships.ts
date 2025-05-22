
import { supabase } from "@/integrations/supabase/client";
import { Relationship } from "@/types/relationship";

// Fetch relationships where current user is owner
export const fetchOwnerRelationships = async (userId: string): Promise<Relationship[]> => {
  try {
    console.log("Fetching owner relationships for userId:", userId);
    
    // First, fetch the relationships
    const { data: relationshipsData, error: relationshipsError } = await supabase
      .from("relationships")
      .select("*")
      .eq("owner_id", userId);
    
    if (relationshipsError) {
      console.error("Error fetching owner relationships:", relationshipsError);
      return [];
    }
    
    console.log("Owner relationships fetched:", relationshipsData?.length || 0, relationshipsData);
    
    // Then fetch the profiles separately and join them manually
    const relationships = relationshipsData as Relationship[];
    const enrichedRelationships = await Promise.all(
      relationships.map(async (relationship) => {
        try {
          // Fetch renter profile
          const { data: renterProfile } = await supabase
            .from("user_profiles")
            .select("full_name, avatar_url")
            .eq("id", relationship.renter_id)
            .single();
            
          return {
            ...relationship,
            renter: {
              full_name: renterProfile?.full_name || 'Unknown User',
              avatar_url: renterProfile?.avatar_url || '',
            }
          };
        } catch (err) {
          console.error("Error fetching renter profile:", err);
          return {
            ...relationship,
            renter: {
              full_name: 'Unknown User',
              avatar_url: '',
            }
          };
        }
      })
    );

    console.log("Enriched owner relationships:", enrichedRelationships);
    return enrichedRelationships;
  } catch (error) {
    console.error("Exception fetching owner relationships:", error);
    return [];
  }
};
