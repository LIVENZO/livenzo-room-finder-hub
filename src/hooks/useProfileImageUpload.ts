
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, uploadProfilePicture, createOrUpdateUserProfile } from '@/services/UserProfileService';

export const useProfileImageUpload = (
  profile: UserProfile | null,
  updateProfile: (profile: UserProfile) => void
) => {
  const { user } = useAuth();
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    console.log('Starting image upload process...', { fileName: file.name, fileSize: file.size });
    
    setUploadingImage(true);
    
    try {
      const imageUrl = await uploadProfilePicture(file, user.id);
      
      if (imageUrl) {
        console.log('Image uploaded successfully, updating profile...', imageUrl);
        
        // Update the profile state immediately for UI feedback
        const updatedProfile = profile ? { ...profile, avatar_url: imageUrl } : null;
        if (updatedProfile) {
          updateProfile(updatedProfile);
        }
        
        // Update the profile in the database
        const updateResult = await createOrUpdateUserProfile({
          id: user.id,
          avatar_url: imageUrl,
        });
        
        if (updateResult) {
          toast.success("Profile picture updated successfully!");
        } else {
          console.error('Failed to update profile with new image URL');
          toast.error("Image uploaded but failed to save to profile. Please try again.");
          // Revert the UI change
          if (profile) {
            updateProfile(profile);
          }
        }
      } else {
        console.error('Upload failed - no image URL returned');
      }
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      toast.error("Upload failed. Please try again or check your internet connection.");
    } finally {
      setUploadingImage(false);
      // Clear the input to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  return {
    uploadingImage,
    handleImageUpload
  };
};
