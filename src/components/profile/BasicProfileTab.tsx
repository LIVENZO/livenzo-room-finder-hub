import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar';
import ProfileForm from './ProfileForm';
import UserIdDisplay from './UserIdDisplay';
import { UserProfile } from '@/services/UserProfileService';
import { User } from '@supabase/supabase-js';
import { useOwnerProperty } from '@/context/OwnerPropertyContext';
import { Button } from '@/components/ui/button';
import { Building, Info, BadgeCheck } from 'lucide-react';

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
  isOwner = false,
}) => {
  const navigate = useNavigate();
  const { activeProperty, properties } = useOwnerProperty();
  const hasProperty = properties.length > 0;

  const displayPublicId = isOwner
    ? activeProperty?.public_id || profile?.public_id
    : profile?.public_id;
  const propertyLabel =
    isOwner && activeProperty
      ? `${activeProperty.hostel_pg_name}${activeProperty.house_number ? ` · House ${activeProperty.house_number}` : ''}`
      : null;

  const displayName = isOwner
    ? formValues.fullName || 'Your Property'
    : formValues.fullName || 'Your Profile';

  return (
    <div className="space-y-5">
      {/* Premium Header Card */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm">
        <div className="absolute inset-0 pointer-events-none opacity-60 [background:radial-gradient(120%_80%_at_100%_0%,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="relative p-6 flex flex-col items-center text-center gap-4">
          <ProfileAvatar
            profile={profile}
            userEmail={user?.email}
            uploadingImage={uploadingImage}
            onImageUpload={onImageUpload}
          />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground leading-tight flex items-center justify-center gap-1.5">
              {displayName}
              {isOwner && hasProperty && (
                <BadgeCheck className="h-5 w-5 text-primary" />
              )}
            </h2>
            {isOwner ? (
              <p className="text-sm text-muted-foreground">
                {propertyLabel || 'Property Owner'}
              </p>
            ) : (
              user?.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )
            )}
            {formValues.phone && (
              <p className="text-xs text-muted-foreground/80 pt-1">
                {formValues.phone}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Form Sections */}
      <ProfileForm
        formValues={formValues}
        profile={profile}
        onInputChange={onInputChange}
        isOwner={isOwner}
      />

      {/* Owner ID Section */}
      {isOwner && (
        <>
          {hasProperty ? (
            <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-5 sm:p-6">
              {propertyLabel && (
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-4">
                  {propertyLabel}
                </p>
              )}
              <UserIdDisplay publicId={displayPublicId || ''} />
            </section>
          ) : (
            <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    Owner ID Not Available
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Add your property first to get your Owner ID. Renters use this ID to
                    connect with you.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/add-property')}
                className="w-full h-12 rounded-xl font-semibold shadow-sm active:scale-[0.98] transition-transform"
              >
                <Building className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </section>
          )}
        </>
      )}

      {/* Renter ID Section */}
      {!isOwner && displayPublicId && (
        <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-5 sm:p-6">
          <UserIdDisplay publicId={displayPublicId} />
        </section>
      )}
    </div>
  );
};

export default BasicProfileTab;
