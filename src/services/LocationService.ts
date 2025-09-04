
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = "Unable to retrieve location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

export const saveOwnerLocation = async (
  userId: string,
  coordinates: LocationCoordinates
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .update({
        location_latitude: coordinates.latitude,
        location_longitude: coordinates.longitude
      })
      .eq("id", userId);

    if (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
      return false;
    }

    toast.success("Location saved successfully");
    return true;
  } catch (error) {
    console.error("Exception saving location:", error);
    toast.error("Failed to save location");
    return false;
  }
};

export const openGoogleMapsDirections = (latitude: number, longitude: number) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  // Use window.location.href for better Android WebView compatibility
  window.location.href = url;
};
