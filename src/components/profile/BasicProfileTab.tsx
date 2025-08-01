
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
    roomNumber: string;
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
      <div className="max-w-2xl mx-auto">
        <ProfileForm
          formValues={formValues}
          profile={profile}
          onInputChange={onInputChange}
        />
      </div>

      {/* Owner ID Section */}
      {profile?.public_id && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-muted/30 rounded-lg p-6 border">
            <UserIdDisplay publicId={profile.public_id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicProfileTab;
