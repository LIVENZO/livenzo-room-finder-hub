
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception fetching user profile:", error);
    return null;
  }
};

export const createOrUpdateUserProfile = async (
  profile: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(profile)
      .select("*")
      .single();

    if (error) {
      toast.error("Failed to update profile");
      console.error("Error updating user profile:", error);
      return null;
    }

    toast.success("Profile updated successfully");
    return data;
  } catch (error) {
    toast.error("Failed to update profile");
    console.error("Exception updating user profile:", error);
    return null;
  }
};

export const uploadProfilePicture = async (file: File, userId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `profiles/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);
    
    if (uploadError) {
      toast.error("Failed to upload profile picture");
      console.error("Error uploading profile picture:", uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    toast.error("Failed to upload profile picture");
    console.error("Exception uploading profile picture:", error);
    return null;
  }
};
