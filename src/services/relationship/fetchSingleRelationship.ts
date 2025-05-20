
import { supabase } from "@/integrations/supabase/client";
import { Relationship } from "@/types/relationship";

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
