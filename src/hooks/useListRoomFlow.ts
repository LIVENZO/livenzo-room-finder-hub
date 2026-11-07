import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth';
import { usePropertyScope } from '@/hooks/usePropertyScope';
import { fetchUserProfile } from '@/services/UserProfileService';

/**
 * Single source of truth for the owner "List Room" flow.
 *
 * Order of checks (unchanged from the owner dashboard):
 *   1. the owner must already have a property, otherwise /add-property
 *   2. the property (or the owner profile) must have a live location,
 *      otherwise /set-location with a return path to /list-room
 *   3. otherwise open /list-room
 */
export const useListRoomFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProperty } = usePropertyScope();

  const openListRoom = useCallback(async () => {
    if (!user) return;

    // Step 1: Check if user has any property
    if (!activeProperty) {
      toast.info("Please add a property first.");
      navigate("/add-property");
      return;
    }

    try {
      // Step 2: Check if the active property has a live location set
      const propLat = activeProperty?.location_latitude;
      const propLng = activeProperty?.location_longitude;
      const propertyHasLocation =
        propLat !== null && propLat !== undefined &&
        propLng !== null && propLng !== undefined &&
        Number(propLat) !== 0 && Number(propLng) !== 0;

      let hasValidLocation = propertyHasLocation;
      if (!hasValidLocation) {
        const profile = await fetchUserProfile(user.id);
        hasValidLocation =
          !!profile?.location_latitude &&
          !!profile?.location_longitude &&
          typeof profile.location_latitude === "number" &&
          typeof profile.location_longitude === "number";
      }

      if (!hasValidLocation) {
        toast.info("Please set your property location before listing rooms.");
        navigate("/set-location", { replace: true, state: { backTo: "/list-room" } });
        return;
      }

      // Step 3: Property and location are both set — proceed to listing
      navigate("/list-room");
    } catch (error) {
      console.error("Error checking prerequisites:", error);
      toast.error("Failed to check prerequisites. Please try again.");
    }
  }, [navigate, user, activeProperty]);

  return { openListRoom };
};
