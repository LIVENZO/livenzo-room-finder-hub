import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';
import { UserProfile } from '@/services/UserProfileService';

interface LocationSetterProps {
  userId: string;
  profile: UserProfile | null;
  onLocationSaved: () => void;
}

const LocationSetter: React.FC<LocationSetterProps> = ({ profile, onLocationSaved }) => {
  const { activeProperty, refresh } = useOwnerProperty();
  const [loading, setLoading] = useState(false);

  // Show coordinates from active property first, then fall back to profile
  const initialCoords =
    activeProperty?.location_latitude && activeProperty?.location_longitude
      ? {
          latitude: Number(activeProperty.location_latitude),
          longitude: Number(activeProperty.location_longitude),
        }
      : profile?.location_latitude && profile?.location_longitude
        ? {
            latitude: Number(profile.location_latitude),
            longitude: Number(profile.location_longitude),
          }
        : null;

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialCoords,
  );

  // Keep state in sync when user switches active property
  React.useEffect(() => {
    if (activeProperty?.location_latitude && activeProperty?.location_longitude) {
      setCurrentLocation({
        latitude: Number(activeProperty.location_latitude),
        longitude: Number(activeProperty.location_longitude),
      });
    } else {
      setCurrentLocation(null);
    }
  }, [activeProperty?.id, activeProperty?.location_latitude, activeProperty?.location_longitude]);

  const fetchCoordinates = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });

  const handleSetLocation = async () => {
    if (!activeProperty?.id) {
      toast.error('Please select a property first');
      return;
    }

    setLoading(true);
    try {
      // Proactively check permission state when supported
      if (navigator.permissions && (navigator.permissions as any).query) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'denied') {
            toast.error('Location permission denied. Please enable it in your browser settings.');
            setLoading(false);
            return;
          }
        } catch {
          /* permissions API not available, continue */
        }
      }

      const position = await fetchCoordinates();
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const { error } = await supabase.rpc('save_property_location', {
        p_property_id: activeProperty.id,
        p_latitude: coords.latitude,
        p_longitude: coords.longitude,
      });

      if (error) {
        console.error('Error saving property location:', error);
        toast.error('Failed to save location. Please try again.');
        return;
      }

      setCurrentLocation(coords);
      toast.success(`Location saved for ${activeProperty.hostel_pg_name}`);
      await refresh();
      onLocationSaved();
    } catch (err: any) {
      console.error('Geolocation error:', err);
      const code = err?.code;
      if (code === 1) {
        toast.error('Permission denied. Please allow location access.');
      } else if (code === 2) {
        toast.error('Location unavailable. Please turn on GPS and try again.');
      } else if (code === 3) {
        toast.error('Location request timed out. Please try again.');
      } else {
        toast.error(err?.message || 'Unable to get location.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          📍 Set Location for {activeProperty?.hostel_pg_name || 'Your Property'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Button onClick={handleSetLocation} disabled={loading || !activeProperty?.id} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Set My Location
              </>
            )}
          </Button>

          {currentLocation && (
            <div className="mt-4 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 font-medium">✅ Location saved successfully</p>
                <p className="text-xs text-green-600 mt-1">
                  {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
                </p>
              </div>

              <div className="bg-gray-100 border rounded-lg p-3">
                <p className="text-sm text-gray-600">🗺️ Map preview will be available to renters</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p>• Saved separately for each property</p>
          <p>• This location will be shown to potential renters</p>
          <p>• Make sure to allow location access when prompted</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationSetter;
