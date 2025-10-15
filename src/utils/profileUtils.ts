
import { UserProfile } from "@/services/UserProfileService";
import { toast } from "sonner";

/**
 * Checks if a user profile is complete with required information
 * @param profile The user profile to check
 * @returns Boolean indicating if the profile is complete
 */
export const isProfileComplete = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  
  // Check for basic required fields - owner uses hostel_pg_name, renter uses full_name
  const hasName = (!!profile.full_name && profile.full_name.trim().length > 0) || 
                  (!!profile.hostel_pg_name && profile.hostel_pg_name.trim().length > 0);
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
  if (!isProfileComplete(profile)) {
    console.log("Basic profile not complete:", { 
      full_name: profile.full_name, 
      phone: profile.phone 
    });
    return false;
  }
  
  // Check owner-specific required fields
  const hasAccommodationType = !!profile.accommodation_type;
  const hasPropertyName = !!profile.property_name && profile.property_name.trim().length > 0;
  const hasHouseNumber = !!profile.house_number && profile.house_number.trim().length > 0;
  const hasValidRooms = !!profile.total_rental_rooms && profile.total_rental_rooms > 0;
  const hasResidentType = !!profile.resident_type;
  const hasPropertyLocation = !!profile.property_location && profile.property_location.trim().length > 0;
  const hasUpiPhoneNumber = !!profile.upi_phone_number && profile.upi_phone_number.trim().length === 10;
  const hasRazorpayMerchantId = !!profile.razorpay_merchant_id && profile.razorpay_merchant_id.trim().length > 0;
  
  // Debug missing fields
  const missingFields = [];
  if (!hasAccommodationType) missingFields.push('accommodation_type');
  if (!hasPropertyName) missingFields.push('property_name');
  if (!hasHouseNumber) missingFields.push('house_number');
  if (!hasValidRooms) missingFields.push('total_rental_rooms');
  if (!hasResidentType) missingFields.push('resident_type');
  if (!hasPropertyLocation) missingFields.push('property_location');
  if (!hasUpiPhoneNumber) missingFields.push('upi_phone_number');
  if (!hasRazorpayMerchantId) missingFields.push('razorpay_merchant_id');
  
  if (missingFields.length > 0) {
    console.log("Owner profile missing fields:", missingFields);
    console.log("Profile data:", {
      accommodation_type: profile.accommodation_type,
      property_name: profile.property_name,
      house_number: profile.house_number,
      total_rental_rooms: profile.total_rental_rooms,
      resident_type: profile.resident_type,
      property_location: profile.property_location,
      upi_phone_number: profile.upi_phone_number,
      razorpay_merchant_id: profile.razorpay_merchant_id
    });
  }
  
  return hasAccommodationType && hasPropertyName && hasHouseNumber && 
         hasValidRooms && hasResidentType && hasPropertyLocation && 
         hasUpiPhoneNumber && hasRazorpayMerchantId;
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
 * Checks if an owner has set their location (required for room listing)
 * @param profile The user profile to check
 * @returns Boolean indicating if the location is set
 */
export const isOwnerLocationSet = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  
  // Check both latitude and longitude presence and ensure they're not null/0/undefined
  const hasValidLocation =
    !!profile?.location_latitude &&
    !!profile?.location_longitude &&
    typeof profile.location_latitude === "number" &&
    typeof profile.location_longitude === "number";
    
  return hasValidLocation;
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

/**
 * Creates a redirect function that checks if owner location is set and redirects if not
 * @param navigate React Router navigate function
 * @param profile User profile to check
 * @param onComplete Optional callback to run if location is set
 * @returns Function that handles the redirection logic
 */
export const requireOwnerLocationSet = (
  navigate: (path: string) => void,
  profile: UserProfile | null,
  onComplete?: () => void
): (() => boolean) => {
  return () => {
    if (!isOwnerLocationSet(profile)) {
      toast.error("Please set your location before listing a room");
      navigate("/set-location");
      return false;
    }
    
    if (onComplete) {
      onComplete();
    }
    return true;
  };
};
