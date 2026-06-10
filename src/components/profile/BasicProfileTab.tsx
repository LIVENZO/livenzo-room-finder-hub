
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar';
import ProfileForm from './ProfileForm';
import UserIdDisplay from './UserIdDisplay';
import { UserProfile } from '@/services/UserProfileService';
import { User } from '@supabase/supabase-js';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';
import { Button } from '@/components/ui/button';
import { Building, Info } from 'lucide-react';

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
  const navigate = useNavigate();
  const { activeProperty, properties } = useOwnerProperty();
  const hasProperty = properties.length > 0;

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

      {/* Owner ID Section — only show if owner has at least one property */}
      {isOwner && (
        <div className="w-full">
          {hasProperty ? (
            <div className="bg-muted/30 rounded-lg p-6 border space-y-2">
              {propertyLabel && (
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {propertyLabel}
                </p>
              )}
              <UserIdDisplay publicId={displayPublicId || ''} />
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-6 border space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Owner ID Not Available
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Please add your property first to get your Owner ID. Renters will use this ID to find and connect with you.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/add-property')}
                className="w-full h-12 rounded-xl bg-primary text-white font-semibold shadow-sm active:scale-[0.98] transition-transform"
              >
                <Building className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Renter ID Section */}
      {!isOwner && displayPublicId && (
        <div className="w-full">
          <div className="bg-muted/30 rounded-lg p-6 border space-y-2">
            <UserIdDisplay publicId={displayPublicId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicProfileTab;
