
import { useState, useEffect } from 'react';
import { UserProfile } from '@/services/UserProfileService';

interface FormValues {
  fullName: string;
  phone: string;
  bio: string;
  roomNumber: string;
}

interface OwnerFormValues {
  accommodationType: string;
  propertyName: string;
  houseNumber: string;
  totalRentalRooms: string;
  residentType: string;
  propertyLocation: string;
  upiId: string;
  upiPhoneNumber: string;
  razorpayMerchantId: string;
}

export const useProfileForms = (profile: UserProfile | null) => {
  const [formValues, setFormValues] = useState<FormValues>({
    fullName: '',
    phone: '',
    bio: '',
    roomNumber: '',
  });

  const [ownerFormValues, setOwnerFormValues] = useState<OwnerFormValues>({
    accommodationType: '',
    propertyName: '',
    houseNumber: '',
    totalRentalRooms: '',
    residentType: '',
    propertyLocation: '',
    upiId: '',
    upiPhoneNumber: '',
    razorpayMerchantId: '',
  });

  useEffect(() => {
    if (profile) {
      setFormValues({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        roomNumber: profile.room_number || '',
      });
      setOwnerFormValues({
        accommodationType: profile.accommodation_type || '',
        propertyName: profile.property_name || '',
        houseNumber: profile.house_number || '',
        totalRentalRooms: profile.total_rental_rooms?.toString() || '',
        residentType: profile.resident_type || '',
        propertyLocation: profile.property_location || '',
        upiId: profile.upi_id || '',
        upiPhoneNumber: profile.upi_phone_number || '',
        razorpayMerchantId: profile.razorpay_merchant_id || '',
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
