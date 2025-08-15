
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, createOrUpdateUserProfile } from '@/services/UserProfileService';
import { isProfileComplete, isOwnerProfileComplete } from '@/utils/profileUtils';

interface FormValues {
  fullName: string;
  phone: string;
  bio: string;
  roomNumber: string;
}

interface OwnerFormValues {
  accommodationType: string;
  propertyName: string;
  houseNumber: string;
  totalRentalRooms: string;
  residentType: string;
  propertyLocation: string;
  upiId: string;
  upiPhoneNumber: string;
}

export const useProfileSave = (
  profile: UserProfile | null,
  formValues: FormValues,
  ownerFormValues: OwnerFormValues,
  updateProfile: (profile: UserProfile) => void
) => {
  const { user, isOwner } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    
    const updatedProfile: Partial<UserProfile> & { id: string } = {
      id: user.id,
      full_name: formValues.fullName,
      phone: formValues.phone,
      bio: formValues.bio,
      room_number: formValues.roomNumber || null,
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
      updatedProfile.upi_id = ownerFormValues.upiId || null;
      updatedProfile.upi_phone_number = ownerFormValues.upiPhoneNumber || null;
    }
    
    const result = await createOrUpdateUserProfile(updatedProfile);
    
    setSaving(false);
    
    if (result) {
      updateProfile(result);

      const profileComplete = isProfileComplete(result);
      const ownerProfileComplete = isOwner ? isOwnerProfileComplete(result) : true;
      
      if (profileComplete && ownerProfileComplete) {
        toast.success("Profile updated successfully! Your profile is now complete.");
      } else {
        toast.success("Profile updated successfully! Please complete remaining fields for full access.");
      }
    }
  };

  return {
    saving,
    handleSave
  };
};
