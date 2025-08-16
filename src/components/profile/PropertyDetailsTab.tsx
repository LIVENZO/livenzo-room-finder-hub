
import React from 'react';
import OwnerPropertyForm from './OwnerPropertyForm';
import { UserProfile } from '@/services/UserProfileService';

interface PropertyDetailsTabProps {
  formValues: {
    accommodationType: string;
    propertyName: string;
    houseNumber: string;
    totalRentalRooms: string;
    residentType: string;
    propertyLocation: string;
    upiId: string;
    upiPhoneNumber: string;
    razorpayMerchantId: string;
  };
  profile: UserProfile | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (field: string, value: string) => void;
}

const PropertyDetailsTab: React.FC<PropertyDetailsTabProps> = ({
  formValues,
  profile,
  onInputChange,
  onSelectChange
}) => {
  return (
    <div className="space-y-6">
      <OwnerPropertyForm
        formValues={formValues}
        profile={profile}
        onInputChange={onInputChange}
        onSelectChange={onSelectChange}
      />
    </div>
  );
};

export default PropertyDetailsTab;
