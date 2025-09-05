
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/relationship";

// Search for a user by public ID using secure function that only returns safe public fields
export const findUserById = async (publicId: string): Promise<UserProfile | null> => {
  try {
    console.log("Searching for user with public ID:", publicId);
    
    // Use the secure function that only returns safe public fields
    const { data, error } = await supabase
      .rpc('search_user_by_public_id', { search_public_id: publicId })
      .maybeSingle();

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
