
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { UserProfile, createOrUpdateUserProfile, fetchUserProfile, uploadProfilePicture } from '@/services/UserProfileService';
import { isProfileComplete, isOwnerProfileComplete } from '@/utils/profileUtils';

interface FormValues {
  fullName: string;
  phone: string;
  bio: string;
}

interface OwnerFormValues {
  accommodationType: string;
  propertyName: string;
  houseNumber: string;
  totalRentalRooms: string;
  residentType: string;
  propertyLocation: string;
}

export const useProfileManagement = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formValues, setFormValues] = useState<FormValues>({
    fullName: '',
    phone: '',
    bio: '',
  });

  const [ownerFormValues, setOwnerFormValues] = useState<OwnerFormValues>({
    accommodationType: '',
    propertyName: '',
    houseNumber: '',
    totalRentalRooms: '',
    residentType: '',
    propertyLocation: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    const loadProfile = async () => {
      setLoading(true);
      const userProfile = await fetchUserProfile(user.id);
      setLoading(false);
      
      if (userProfile) {
        setProfile(userProfile);
        setFormValues({
          fullName: userProfile.full_name || '',
          phone: userProfile.phone || '',
          bio: userProfile.bio || '',
        });
        setOwnerFormValues({
          accommodationType: userProfile.accommodation_type || '',
          propertyName: userProfile.property_name || '',
          houseNumber: userProfile.house_number || '',
          totalRentalRooms: userProfile.total_rental_rooms?.toString() || '',
          residentType: userProfile.resident_type || '',
          propertyLocation: userProfile.property_location || '',
        });
      } else {
        // Create a new profile with basic details
        const newProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        };
        
        setProfile(newProfile as UserProfile);
        setFormValues({
          fullName: newProfile.full_name || '',
          phone: '',
          bio: '',
        });
      }
    };
    
    loadProfile();
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOwnerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOwnerFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOwnerSelectChange = (field: string, value: string) => {
    setOwnerFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    
    const updatedProfile: Partial<UserProfile> & { id: string } = {
      id: user.id,
      full_name: formValues.fullName,
      phone: formValues.phone,
      bio: formValues.bio,
      avatar_url: profile.avatar_url,
    };

    // Add owner-specific fields if user is an owner
    if (isOwner) {
      updatedProfile.accommodation_type = ownerFormValues.accommodationType as 'PG' | 'Hostel' || null;
      updatedProfile.property_name = ownerFormValues.propertyName || null;
      updatedProfile.house_number = ownerFormValues.houseNumber || null;
      updatedProfile.total_rental_rooms = ownerFormValues.totalRentalRooms ? parseInt(ownerFormValues.totalRentalRooms) : null;
      updatedProfile.resident_type = ownerFormValues.residentType as 'Boys' | 'Girls' | 'Both' || null;
      updatedProfile.property_location = ownerFormValues.propertyLocation || null;
    }
    
    const result = await createOrUpdateUserProfile(updatedProfile);
    
    setSaving(false);
    
    if (result) {
      setProfile(result);

      const profileComplete = isProfileComplete(result);
      const ownerProfileComplete = isOwner ? isOwnerProfileComplete(result) : true;
      
      if (profileComplete && ownerProfileComplete) {
        toast.success("Profile updated successfully! Your profile is now complete.");
      } else {
        toast.success("Profile updated successfully! Please complete remaining fields for full access.");
      }
    }
  };

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
        setProfile(prev => prev ? { ...prev, avatar_url: imageUrl } : null);
        
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
          setProfile(prev => prev ? { ...prev, avatar_url: profile?.avatar_url } : null);
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

  const handleLocationSaved = async () => {
    // Refresh profile data after location is saved
    if (user) {
      const updatedProfile = await fetchUserProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    }
  };

  return {
    profile,
    loading,
    saving,
    uploadingImage,
    formValues,
    ownerFormValues,
    handleInputChange,
    handleOwnerInputChange,
    handleOwnerSelectChange,
    handleSave,
    handleImageUpload,
    handleLocationSaved,
    user,
    isOwner
  };
};
