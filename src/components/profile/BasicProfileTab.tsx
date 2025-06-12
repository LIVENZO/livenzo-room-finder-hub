
import React from 'react';
import ProfileAvatar from './ProfileAvatar';
import ProfileForm from './ProfileForm';
import UserIdDisplay from './UserIdDisplay';
import { UserProfile } from '@/services/UserProfileService';
import { User } from '@supabase/supabase-js';

interface BasicProfileTabProps {
  profile: UserProfile | null;
  user: User | null;
  formValues: {
    fullName: string;
    phone: string;
    bio: string;
  };
  uploadingImage: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BasicProfileTab: React.FC<BasicProfileTabProps> = ({
  profile,
  user,
  formValues,
  uploadingImage,
  onInputChange,
  onImageUpload
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
        <ProfileAvatar
          profile={profile}
          userEmail={user?.email}
          uploadingImage={uploadingImage}
          onImageUpload={onImageUpload}
        />
        
        <ProfileForm
          formValues={formValues}
          profile={profile}
          onInputChange={onInputChange}
        />
      </div>

      {profile?.public_id && (
        <UserIdDisplay publicId={profile.public_id} />
      )}
    </div>
  );
};

export default BasicProfileTab;
