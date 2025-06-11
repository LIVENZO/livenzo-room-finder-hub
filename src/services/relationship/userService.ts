
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/relationship";

// Search for a user by ID (supports both full UID and first 8 characters)
export const findUserById = async (userId: string): Promise<UserProfile | null> => {
  try {
    let query = supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url");

    // If the input is 8 characters or less, search by prefix
    if (userId.length <= 8) {
      // Cast UUID to text for prefix matching
      query = query.filter('id::text', 'like', `${userId}%`);
    } else {
      // For longer inputs, search by exact match
      query = query.eq("id", userId);
    }

    const { data, error } = await query.maybeSingle();

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
