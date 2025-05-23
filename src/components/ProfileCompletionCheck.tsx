
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchUserProfile } from '@/services/UserProfileService';
import { isProfileComplete } from '@/utils/profileUtils';
import { useNavigate } from 'react-router-dom';

/**
 * Component to check profile completion status and show a toast notification if incomplete
 */
const ProfileCompletionCheck: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once per session and only if user is logged in
    if (user && !hasChecked) {
      const checkProfileCompletion = async () => {
        const profile = await fetchUserProfile(user.id);
        
        if (profile && !isProfileComplete(profile)) {
          const toastId = toast.warning(
            "Your profile is incomplete. Some features may be limited.",
            {
              duration: 8000,
              action: {
                label: "Complete Profile",
                onClick: () => navigate('/profile')
              },
            }
          );
        }
        
        setHasChecked(true);
      };
      
      // Delay the check a bit to not interfere with page loading
      const timer = setTimeout(() => {
        checkProfileCompletion();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, hasChecked, navigate]);

  return null; // This is a utility component with no UI
};

export default ProfileCompletionCheck;
