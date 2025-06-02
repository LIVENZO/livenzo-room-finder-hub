
import React from 'react';
import LocationSetter from './LocationSetter';
import { UserProfile } from '@/services/UserProfileService';

interface LocationTabProps {
  userId: string;
  profile: UserProfile | null;
  onLocationSaved: () => void;
}

const LocationTab: React.FC<LocationTabProps> = ({
  userId,
  profile,
  onLocationSaved
}) => {
  return (
    <div className="space-y-6">
      <LocationSetter
        userId={userId}
        profile={profile}
        onLocationSaved={onLocationSaved}
      />
    </div>
  );
};

export default LocationTab;
