
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/relationship";

// Search for a user by ID
export const findUserById = async (userId: string): Promise<UserProfile | null> => {
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
