
import { supabase } from "@/integrations/supabase/client";
import { Relationship } from "@/types/relationship";

// Fetch relationships where current user is owner.
// When `propertyId` is provided, results are scoped to that single property
// (each property in multi-property accounts behaves like an independent dashboard).
// `propertyId` semantics:
//   - undefined → no scoping (legacy behaviour, all properties)
//   - string    → only relationships explicitly linked to that property
//                 PLUS legacy rows with NULL property_id (so the primary
//                 property continues to "own" rows that pre-date scoping).
export const fetchOwnerRelationships = async (
  userId: string,
  propertyId?: string,
  isPrimaryProperty: boolean = false,
): Promise<Relationship[]> => {
  try {
    console.log("Fetching owner relationships for userId:", userId, "property:", propertyId, "primary:", isPrimaryProperty);
    
    // Build the query
    let query = supabase
      .from("relationships")
      .select("*")
      .eq("owner_id", userId);

    if (propertyId) {
      // Primary property absorbs legacy NULL rows; secondary properties only see their own
      if (isPrimaryProperty) {
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      } else {
        query = query.eq("property_id", propertyId);
      }
    }

    const { data: relationshipsData, error: relationshipsError } = await query;
    
    if (relationshipsError) {
      console.error("Error fetching owner relationships:", relationshipsError);
      return [];
    }
    
    console.log("Owner relationships fetched:", relationshipsData?.length || 0);
    
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
