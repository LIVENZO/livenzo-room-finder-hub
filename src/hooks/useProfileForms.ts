
import { useState, useEffect } from 'react';
import { UserProfile } from '@/services/UserProfileService';

interface FormValues {
  fullName: string;
  phone: string;
  bio: string;
}

interface OwnerFormValues {
  accommodationType: string;
  propertyName: string;
  houseNumber: string;
  totalRentalRooms: string;
  residentType: string;
  propertyLocation: string;
}

export const useProfileForms = (profile: UserProfile | null) => {
  const [formValues, setFormValues] = useState<FormValues>({
    fullName: '',
    phone: '',
    bio: '',
  });

  const [ownerFormValues, setOwnerFormValues] = useState<OwnerFormValues>({
    accommodationType: '',
    propertyName: '',
    houseNumber: '',
    totalRentalRooms: '',
    residentType: '',
    propertyLocation: '',
  });

  useEffect(() => {
    if (profile) {
      setFormValues({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
      setOwnerFormValues({
        accommodationType: profile.accommodation_type || '',
        propertyName: profile.property_name || '',
        houseNumber: profile.house_number || '',
        totalRentalRooms: profile.total_rental_rooms?.toString() || '',
        residentType: profile.resident_type || '',
        propertyLocation: profile.property_location || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOwnerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOwnerFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOwnerSelectChange = (field: string, value: string) => {
    setOwnerFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    formValues,
    ownerFormValues,
    handleInputChange,
    handleOwnerInputChange,
    handleOwnerSelectChange
  };
};
