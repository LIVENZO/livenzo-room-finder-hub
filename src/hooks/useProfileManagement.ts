
import { useAuth } from '@/context/AuthContext';
import { useProfileData } from './useProfileData';
import { useProfileForms } from './useProfileForms';
import { useProfileSave } from './useProfileSave';
import { useProfileImageUpload } from './useProfileImageUpload';
import { useProfileLocationUpdate } from './useProfileLocationUpdate';

export const useProfileManagement = () => {
  const { isOwner } = useAuth();
  const { profile, loading, updateProfile, user } = useProfileData();
  const {
    formValues,
    ownerFormValues,
    handleInputChange,
    handleOwnerInputChange,
    handleOwnerSelectChange
  } = useProfileForms(profile);
  
  const { saving, handleSave } = useProfileSave(
    profile,
    formValues,
    ownerFormValues,
    updateProfile
  );
  
  const { uploadingImage, handleImageUpload } = useProfileImageUpload(
    profile,
    updateProfile
  );
  
  const { handleLocationSaved } = useProfileLocationUpdate(updateProfile);

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
