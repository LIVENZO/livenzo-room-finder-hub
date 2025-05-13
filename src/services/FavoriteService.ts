
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  user_id: string;
  room_id: string;
  created_at: string;
}

export const addFavorite = async (
  userId: string,
  roomId: string
): Promise<Favorite | null> => {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, room_id: roomId })
      .select("*")
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast.error("Room is already in your favorites");
      } else {
        toast.error("Failed to add to favorites");
        console.error("Error adding favorite:", error);
      }
      return null;
    }

    toast.success("Added to favorites");
    return data;
  } catch (error) {
    toast.error("Failed to add to favorites");
    console.error("Exception adding favorite:", error);
    return null;
  }
};

export const removeFavorite = async (
  userId: string,
  roomId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .match({ user_id: userId, room_id: roomId });

    if (error) {
      toast.error("Failed to remove from favorites");
      console.error("Error removing favorite:", error);
      return false;
    }

    toast.success("Removed from favorites");
    return true;
  } catch (error) {
    toast.error("Failed to remove from favorites");
    console.error("Exception removing favorite:", error);
    return false;
  }
};

export const fetchUserFavorites = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("room_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching favorites:", error);
      return [];
    }

    return data.map(fav => fav.room_id) || [];
  } catch (error) {
    console.error("Exception fetching favorites:", error);
    return [];
  }
};

export const checkIsFavorite = async (
  userId: string,
  roomId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .match({ user_id: userId, room_id: roomId })
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
        console.error("Error checking favorite status:", error);
      }
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Exception checking favorite status:", error);
    return false;
  }
};
