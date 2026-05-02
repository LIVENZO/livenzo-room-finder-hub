
import React from 'react';
import ProfileAvatar from './ProfileAvatar';
import ProfileForm from './ProfileForm';
import UserIdDisplay from './UserIdDisplay';
import { UserProfile } from '@/services/UserProfileService';
import { User } from '@supabase/supabase-js';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';

interface BasicProfileTabProps {
  profile: UserProfile | null;
  user: User | null;
  formValues: {
    fullName: string;
    phone: string;
    bio: string;
    roomNumber: string;
  };
  uploadingImage: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isOwner?: boolean;
}

const BasicProfileTab: React.FC<BasicProfileTabProps> = ({
  profile,
  user,
  formValues,
  uploadingImage,
  onInputChange,
  onImageUpload,
  isOwner = false
}) => {
  const { activeProperty } = useOwnerProperty();
  // For owners, show the active property's public_id so switching property
  // instantly updates the visible Owner ID. Renters keep their profile public_id.
  const displayPublicId = isOwner
    ? (activeProperty?.public_id || profile?.public_id)
    : profile?.public_id;
  const propertyLabel = isOwner && activeProperty
    ? `${activeProperty.hostel_pg_name}${activeProperty.house_number ? ` · House ${activeProperty.house_number}` : ''}`
    : null;

  return (
    <div className="space-y-10">
      {/* Profile Avatar Section */}
      <div className="flex justify-center">
        <ProfileAvatar
          profile={profile}
          userEmail={user?.email}
          uploadingImage={uploadingImage}
          onImageUpload={onImageUpload}
        />
      </div>
      
      {/* Profile Form Section */}
      <div className="w-full">
        <ProfileForm
          formValues={formValues}
          profile={profile}
          onInputChange={onInputChange}
          isOwner={isOwner}
        />
      </div>

      {/* Owner ID Section — per-property for owners */}
      {displayPublicId && (
        <div className="w-full">
          <div className="bg-muted/30 rounded-lg p-6 border space-y-2">
            {propertyLabel && (
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {propertyLabel}
              </p>
            )}
            <UserIdDisplay publicId={displayPublicId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicProfileTab;
