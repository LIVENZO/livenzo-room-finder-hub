
import { UserProfile } from "@/services/UserProfileService";

/**
 * Checks if a user profile is complete with required information
 * @param profile The user profile to check
 * @returns Boolean indicating if the profile is complete
 */
export const isProfileComplete = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  
  // Check for required fields
  const hasName = !!profile.full_name && profile.full_name.trim().length > 0;
  const hasPhone = !!profile.phone && profile.phone.trim().length > 0;
  
  return hasName && hasPhone;
};

/**
 * Creates a redirect function that checks profile completion and redirects if incomplete
 * @param navigate React Router navigate function
 * @param profile User profile to check
 * @param onComplete Optional callback to run if profile is complete
 * @returns Function that handles the redirection logic
 */
export const requireCompleteProfile = (
  navigate: (path: string) => void,
  profile: UserProfile | null,
  onComplete?: () => void
): (() => boolean) => {
  return () => {
    if (!isProfileComplete(profile)) {
      toast.error("Please complete your profile before continuing");
      navigate("/profile");
      return false;
    }
    
    if (onComplete) {
      onComplete();
    }
    return true;
  };
};
