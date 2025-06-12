
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/relationship";

// Search for a user by public ID (supports both full public_id and partial matches)
export const findUserById = async (publicId: string): Promise<UserProfile | null> => {
  try {
    console.log("Searching for user with public ID:", publicId);
    
    let query = supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url, public_id");

    // Search by public_id using prefix matching for shorter inputs
    if (publicId.length <= 10) {
      console.log("Searching by public_id prefix for:", publicId);
      query = query.filter('public_id', 'like', `${publicId}%`);
    } else {
      console.log("Searching by exact public_id match for:", publicId);
      query = query.eq("public_id", publicId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error finding user:", error);
      return null;
    }

    console.log("Search result:", data);
    return data;
  } catch (error) {
    console.error("Exception finding user:", error);
    return null;
  }
};
