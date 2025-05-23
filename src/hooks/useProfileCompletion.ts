
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { fetchUserProfile, UserProfile } from "@/services/UserProfileService";
import { isProfileComplete } from "@/utils/profileUtils";

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const userProfile = await fetchUserProfile(user.id);
      setProfile(userProfile);
      setIsComplete(isProfileComplete(userProfile));
      setIsLoading(false);
    };

    loadProfile();
  }, [user]);

  const requireComplete = (onComplete?: () => void) => {
    if (isLoading) return false;
    
    if (!isComplete) {
      toast.error("Please complete your profile before continuing");
      navigate("/profile");
      return false;
    }

    if (onComplete) {
      onComplete();
    }
    return true;
  };

  return {
    profile,
    isLoading,
    isComplete,
    requireComplete,
  };
};
