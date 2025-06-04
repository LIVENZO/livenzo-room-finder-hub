
import { useAuth } from '@/context/AuthContext';
import { fetchUserProfile } from '@/services/UserProfileService';

export const useProfileLocationUpdate = (updateProfile: (profile: any) => void) => {
  const { user } = useAuth();

  const handleLocationSaved = async () => {
    // Refresh profile data after location is saved
    if (user) {
      const updatedProfile = await fetchUserProfile(user.id);
      if (updatedProfile) {
        updateProfile(updatedProfile);
      }
    }
  };

  return {
    handleLocationSaved
  };
};
