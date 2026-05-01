
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/relationship";

// Extend UserProfile with optional property context (when search hit a property)
export interface FoundConnectionTarget extends UserProfile {
  /** Owner's user_profiles.id — used for the relationship row */
  id: string;
  /** Optional property context (set when the public_id belonged to an owner_property) */
  property_id?: string | null;
  property_name?: string | null;
  house_number?: string | null;
  property_location?: string | null;
}

/**
 * Search for a connection target by a public ID.
 *
 * The same search box now resolves two kinds of IDs:
 *  1. A per-property public_id (owner_properties.public_id) — preferred.
 *     Returns the owner + property context so the relationship is created
 *     against that specific property.
 *  2. A legacy owner public_id (user_profiles.public_id) — fallback for
 *     existing IDs already shared with renters.
 */
export const findUserById = async (publicId: string): Promise<FoundConnectionTarget | null> => {
  try {
    const trimmed = publicId.trim();
    if (!trimmed) return null;

    console.log("Searching for property/owner with public ID:", trimmed);

    // 1) Try property lookup first (new per-property IDs)
    const { data: propertyHit, error: propertyError } = await supabase
      .rpc("search_property_by_public_id", { search_public_id: trimmed })
      .maybeSingle();

    if (!propertyError && propertyHit) {
      // Pull the owner's display name from user_profiles for nicer UI
      const { data: ownerProfile } = await supabase
        .from("user_profiles")
        .select("full_name, hostel_pg_name, avatar_url, public_id")
        .eq("id", propertyHit.owner_id)
        .maybeSingle();

      return {
        id: propertyHit.owner_id,
        full_name:
          propertyHit.hostel_pg_name ||
          ownerProfile?.hostel_pg_name ||
          ownerProfile?.full_name ||
          "Property Owner",
        avatar_url: propertyHit.avatar_url || ownerProfile?.avatar_url || "",
        public_id: propertyHit.public_id,
        property_id: propertyHit.property_id,
        property_name: propertyHit.hostel_pg_name,
        house_number: propertyHit.house_number,
        property_location: propertyHit.property_location,
      };
    }

    // 2) Fallback: legacy owner public_id
    const { data: ownerHit, error: ownerError } = await supabase
      .rpc("search_user_by_public_id", { search_public_id: trimmed })
      .maybeSingle();

    if (ownerError) {
      console.error("Error finding user:", ownerError);
      return null;
    }

    if (!ownerHit) return null;

    return {
      id: ownerHit.id,
      full_name: ownerHit.full_name,
      avatar_url: ownerHit.avatar_url,
      public_id: ownerHit.public_id,
      property_id: null,
    };
  } catch (error) {
    console.error("Exception finding user:", error);
    return null;
  }
};
