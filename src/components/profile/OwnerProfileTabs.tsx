
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BasicProfileTab from './BasicProfileTab';
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
    roomNumber: string;
  };
  ownerFormValues: {
    accommodationType: string;
    propertyName: string;
    houseNumber: string;
    totalRentalRooms: string;
    residentType: string;
    propertyLocation: string;
    upiId: string;
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
      <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 rounded-lg p-1">
        <TabsTrigger 
          value="basic" 
          className="text-base font-semibold h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          Basic Information
        </TabsTrigger>
        <TabsTrigger 
          value="location" 
          className="text-base font-semibold h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          Location
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="mt-8">
        <BasicProfileTab
          profile={profile}
          user={user}
          formValues={formValues}
          uploadingImage={uploadingImage}
          onInputChange={onInputChange}
          onImageUpload={onImageUpload}
        />
      </TabsContent>

      <TabsContent value="location" className="mt-8">
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
