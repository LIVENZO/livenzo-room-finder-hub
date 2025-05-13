
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Review {
  id: string;
  user_id: string;
  room_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const createReview = async (
  review: Omit<Review, 'id' | 'created_at'>
): Promise<Review | null> => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert(review)
      .select("*")
      .single();

    if (error) {
      toast.error("Failed to submit review");
      console.error("Error creating review:", error);
      return null;
    }

    toast.success("Review submitted successfully");
    return data;
  } catch (error) {
    toast.error("Failed to submit review");
    console.error("Exception creating review:", error);
    return null;
  }
};

export const fetchRoomReviews = async (roomId: string): Promise<Review[]> => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, user_profiles(full_name, avatar_url)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching room reviews:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception fetching room reviews:", error);
    return [];
  }
};

export const updateReview = async (
  reviewId: string,
  updates: Partial<Pick<Review, 'rating' | 'comment'>>
): Promise<Review | null> => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", reviewId)
      .select("*")
      .single();

    if (error) {
      toast.error("Failed to update review");
      console.error("Error updating review:", error);
      return null;
    }

    toast.success("Review updated successfully");
    return data;
  } catch (error) {
    toast.error("Failed to update review");
    console.error("Exception updating review:", error);
    return null;
  }
};

export const deleteReview = async (reviewId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      toast.error("Failed to delete review");
      console.error("Error deleting review:", error);
      return false;
    }

    toast.success("Review deleted successfully");
    return true;
  } catch (error) {
    toast.error("Failed to delete review");
    console.error("Exception deleting review:", error);
    return false;
  }
};
