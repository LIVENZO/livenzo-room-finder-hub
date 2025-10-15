
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserProfile, fetchUserProfile } from '@/services/UserProfileService';

export const useProfileData = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
      } else {
        // Create a new profile with basic details
        const newProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          hostel_pg_name: '', // Initialize for owners
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        };
        
        setProfile(newProfile as UserProfile);
      }
    };
    
    loadProfile();
  }, [user, navigate]);

  const updateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  return {
    profile,
    loading,
    updateProfile,
    user
  };
};
