
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BasicProfileTab from './BasicProfileTab';
import PropertyDetailsTab from './PropertyDetailsTab';
import LocationTab from './LocationTab';
import { UserProfile } from '@/services/UserProfileService';
import { User } from '@supabase/supabase-js';

interface OwnerProfileTabsProps {
  profile: UserProfile | null;
  user: User | null;
  formValues: {
    fullName: string;
    phone: string;
    bio: string;
  };
  ownerFormValues: {
    accommodationType: string;
    propertyName: string;
    houseNumber: string;
    totalRentalRooms: string;
    residentType: string;
    propertyLocation: string;
  };
  uploadingImage: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onOwnerInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOwnerSelectChange: (field: string, value: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLocationSaved: () => void;
}

const OwnerProfileTabs: React.FC<OwnerProfileTabsProps> = ({
  profile,
  user,
  formValues,
  ownerFormValues,
  uploadingImage,
  onInputChange,
  onOwnerInputChange,
  onOwnerSelectChange,
  onImageUpload,
  onLocationSaved
}) => {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic Information</TabsTrigger>
        <TabsTrigger value="property">Property Details</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic">
        <BasicProfileTab
          profile={profile}
          user={user}
          formValues={formValues}
          uploadingImage={uploadingImage}
          onInputChange={onInputChange}
          onImageUpload={onImageUpload}
        />
      </TabsContent>

      <TabsContent value="property">
        <PropertyDetailsTab
          formValues={ownerFormValues}
          profile={profile}
          onInputChange={onOwnerInputChange}
          onSelectChange={onOwnerSelectChange}
        />
      </TabsContent>

      <TabsContent value="location">
        {user && (
          <LocationTab
            userId={user.id}
            profile={profile}
            onLocationSaved={onLocationSaved}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default OwnerProfileTabs;
