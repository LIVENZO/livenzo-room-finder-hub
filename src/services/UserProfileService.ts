
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFilesSecure } from './storage/secureStorage';

export interface UserProfile {
  id: string;
  full_name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  accommodation_type?: 'PG' | 'Hostel' | null;
  property_name?: string | null;
  house_number?: string | null;
  total_rental_rooms?: number | null;
  resident_type?: 'Boys' | 'Girls' | 'Both' | null;
  property_location?: string | null;
  location_latitude?: number | null;
  location_longitude?: number | null;
  created_at?: string;
  updated_at?: string;
  is_owner_profile_complete?: boolean;
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found, return null
        return null;
      }
      console.error("Error fetching user profile:", error);
      return null;
    }

    // Type cast accommodation_type and resident_type
    return {
      ...data,
      accommodation_type: data.accommodation_type as 'PG' | 'Hostel' | null,
      resident_type: data.resident_type as 'Boys' | 'Girls' | 'Both' | null,
    } as UserProfile;
  } catch (error) {
    console.error("Exception fetching user profile:", error);
    return null;
  }
};

export const createOrUpdateUserProfile = async (profile: Partial<UserProfile> & { id: string }): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Error creating/updating user profile:", error);
      toast.error("Failed to update profile");
      return null;
    }

    // Type cast accommodation_type and resident_type
    return {
      ...data,
      accommodation_type: data.accommodation_type as 'PG' | 'Hostel' | null,
      resident_type: data.resident_type as 'Boys' | 'Girls' | 'Both' | null,
    } as UserProfile;
  } catch (error) {
    console.error("Exception creating/updating user profile:", error);
    toast.error("Failed to update profile");
    return null;
  }
};

export const uploadProfilePicture = async (file: File, userId: string): Promise<string | null> => {
  try {
    console.log('Starting profile picture upload...', { fileName: file.name, fileSize: file.size, fileType: file.type });
    
    // Use the secure upload service with retry logic
    const uploadedUrls = await uploadFilesSecure([file], userId, 'user-uploads', 'image');
    
    if (uploadedUrls.length > 0) {
      console.log('Profile picture uploaded successfully:', uploadedUrls[0]);
      return uploadedUrls[0];
    }
    
    console.error('No URLs returned from upload service');
    toast.error("Failed to upload image. Please try a different image or check your internet connection.");
    return null;
  } catch (error) {
    console.error("Exception uploading profile picture:", error);
    toast.error("Upload failed. Please try again or check your internet connection.");
    return null;
  }
};
