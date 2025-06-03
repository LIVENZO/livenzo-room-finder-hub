
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateAuthentication } from './authValidator';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Securely gets current location with proper error handling
 */
export const getCurrentLocationSecure = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        // Validate coordinates
        if (coords.latitude < -90 || coords.latitude > 90 || 
            coords.longitude < -180 || coords.longitude > 180) {
          reject(new Error('Invalid coordinates received'));
          return;
        }
        
        resolve(coords);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
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

/**
 * Securely saves owner location with authentication validation
 */
export const saveOwnerLocationSecure = async (
  userId: string,
  coordinates: LocationCoordinates
): Promise<boolean> => {
  try {
    // Validate authentication
    const authResult = await validateAuthentication();
    if (!authResult.isValid || authResult.userId !== userId) {
      toast.error('Unauthorized to update location');
      return false;
    }
    
    // Validate coordinates
    if (coordinates.latitude < -90 || coordinates.latitude > 90 || 
        coordinates.longitude < -180 || coordinates.longitude > 180) {
      toast.error('Invalid coordinates provided');
      return false;
    }
    
    const { error } = await supabase
      .from('user_profiles')
      .update({
        location_latitude: coordinates.latitude,
        location_longitude: coordinates.longitude
      })
      .eq('id', userId);

    if (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
      return false;
    }

    toast.success('Location saved successfully');
    return true;
  } catch (error) {
    console.error('Exception saving location:', error);
    toast.error('Failed to save location');
    return false;
  }
};

/**
 * Securely gets maps URLs using edge function
 */
export const getMapsUrlsSecure = async (
  latitude: number,
  longitude: number
): Promise<{ embedUrl?: string; directionsUrl?: string } | null> => {
  try {
    const authResult = await validateAuthentication();
    if (!authResult.isValid) {
      return null;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    // Get embed URL
    const embedResponse = await supabase.functions.invoke('maps-proxy', {
      body: { action: 'embed', lat: latitude, lng: longitude },
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    // Get directions URL  
    const directionsResponse = await supabase.functions.invoke('maps-proxy', {
      body: { action: 'directions', lat: latitude, lng: longitude },
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (embedResponse.error || directionsResponse.error) {
      console.error('Maps proxy error:', embedResponse.error || directionsResponse.error);
      return null;
    }
    
    return {
      embedUrl: embedResponse.data?.embedUrl,
      directionsUrl: directionsResponse.data?.directionsUrl
    };
  } catch (error) {
    console.error('Error getting maps URLs:', error);
    return null;
  }
};
