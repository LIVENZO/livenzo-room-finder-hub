
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { getCurrentLocationSecure, saveOwnerLocationSecure } from '@/services/security/secureLocationService';
import { UserProfile } from '@/services/UserProfileService';
import { toast } from 'sonner';

interface LocationSetterProps {
  userId: string;
  profile: UserProfile | null;
  onLocationSaved: () => void;
}

const LocationSetter: React.FC<LocationSetterProps> = ({ userId, profile, onLocationSaved }) => {
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(
    profile?.location_latitude && profile?.location_longitude
      ? {
          latitude: Number(profile.location_latitude),
          longitude: Number(profile.location_longitude)
        }
      : null
  );

  const handleSetLocation = async () => {
    setLoading(true);
    try {
      const coordinates = await getCurrentLocationSecure();
      const success = await saveOwnerLocationSecure(userId, coordinates);
      
      if (success) {
        setCurrentLocation(coordinates);
        onLocationSaved();
      } else {
        toast.error('Failed to save location. Please try again.');
      }
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          📍 Set Your PG Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Button
            onClick={handleSetLocation}
            disabled={loading}
            className="w-full"
          >
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
                <p className="text-sm text-green-700 font-medium">
                  ✅ Location saved successfully
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Location coordinates secured
                </p>
              </div>
              
              <div className="bg-gray-100 border rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  🗺️ Map preview will be available to renters
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          <p>• This location will be shown to potential renters</p>
          <p>• Your exact coordinates are kept secure</p>
          <p>• Make sure to allow location access when prompted</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationSetter;
