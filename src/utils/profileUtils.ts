
import { UserProfile } from "@/services/UserProfileService";
import { toast } from "sonner";

/**
 * Checks if a user profile is complete with required information
 * @param profile The user profile to check
 * @returns Boolean indicating if the profile is complete
 */
export const isProfileComplete = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  
  // Check for basic required fields
  const hasName = !!profile.full_name && profile.full_name.trim().length > 0;
  const hasPhone = !!profile.phone && profile.phone.trim().length > 0;
  
  return hasName && hasPhone;
};

/**
 * Checks if an owner profile is complete with all required property information
 * @param profile The user profile to check
 * @returns Boolean indicating if the owner profile is complete
 */
export const isOwnerProfileComplete = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  
  // Check basic profile completion first
  if (!isProfileComplete(profile)) return false;
  
  // Check owner-specific required fields
  const hasAccommodationType = !!profile.accommodation_type;
  const hasPropertyName = !!profile.property_name && profile.property_name.trim().length > 0;
  const hasHouseNumber = !!profile.house_number && profile.house_number.trim().length > 0;
  const hasValidRooms = !!profile.total_rental_rooms && profile.total_rental_rooms > 0;
  const hasResidentType = !!profile.resident_type;
  const hasPropertyLocation = !!profile.property_location && profile.property_location.trim().length > 0;
  const hasUpiPhoneNumber = !!profile.upi_phone_number && profile.upi_phone_number.trim().length === 10;
  
  return hasAccommodationType && hasPropertyName && hasHouseNumber && 
         hasValidRooms && hasResidentType && hasPropertyLocation && hasUpiPhoneNumber;
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

/**
 * Creates a redirect function that checks owner profile completion and redirects if incomplete
 * @param navigate React Router navigate function
 * @param profile User profile to check
 * @param onComplete Optional callback to run if profile is complete
 * @returns Function that handles the redirection logic
 */
export const requireCompleteOwnerProfile = (
  navigate: (path: string) => void,
  profile: UserProfile | null,
  onComplete?: () => void
): (() => boolean) => {
  return () => {
    if (!isOwnerProfileComplete(profile)) {
      toast.error("Please complete your property details before continuing");
      navigate("/profile");
      return false;
    }
    
    if (onComplete) {
      onComplete();
    }
    return true;
  };
};
