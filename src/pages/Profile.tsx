import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';
import ProfileCompletionBanner from '@/components/profile/ProfileCompletionBanner';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileForm from '@/components/profile/ProfileForm';
import OwnerPropertyDisplay from '@/components/profile/OwnerPropertyDisplay';
import ProfileActions from '@/components/profile/ProfileActions';
import OwnerProfileTabs from '@/components/profile/OwnerProfileTabs';
import ConnectAnotherProperty from '@/components/profile/ConnectAnotherProperty';

import StickySaveBar from '@/components/profile/StickySaveBar';
import { useProfileManagement } from '@/hooks/useProfileManagement';
import { isProfileComplete, isOwnerProfileComplete } from '@/utils/profileUtils';
import { toast } from 'sonner';
const Profile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    profile,
    loading,
    saving,
    uploadingImage,
    formValues,
    ownerFormValues,
    handleInputChange,
    handleOwnerInputChange,
    handleOwnerSelectChange,
    handleSave,
    handleImageUpload,
    handleLocationSaved,
    user,
    isOwner
  } = useProfileManagement();

  // Detect unsaved changes by comparing form values to the saved profile
  const dirty = useMemo(() => {
    if (!profile) return false;
    const baseName = isOwner ? (profile.hostel_pg_name || '') : (profile.full_name || '');
    if (formValues.fullName !== baseName) return true;
    if (formValues.phone !== (profile.phone || '')) return true;
    if (formValues.bio !== (profile.bio || '')) return true;
    if (formValues.roomNumber !== (profile.room_number || '')) return true;
    if (isOwner) {
      if (ownerFormValues.accommodationType !== (profile.accommodation_type || '')) return true;
      if (ownerFormValues.propertyName !== (profile.property_name || '')) return true;
      if (ownerFormValues.houseNumber !== (profile.house_number || '')) return true;
      if (ownerFormValues.totalRentalRooms !== (profile.total_rental_rooms?.toString() || '')) return true;
      if (ownerFormValues.residentType !== (profile.resident_type || '')) return true;
      if (ownerFormValues.propertyLocation !== (profile.property_location || '')) return true;
      if (ownerFormValues.upiId !== (profile.upi_id || '')) return true;
      if (ownerFormValues.upiPhoneNumber !== (profile.upi_phone_number || '')) return true;
      if (ownerFormValues.razorpayMerchantId !== (profile.razorpay_merchant_id || '')) return true;
    }
    return false;
  }, [profile, formValues, ownerFormValues, isOwner]);

  // Handle return navigation after profile completion
  useEffect(() => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo && profile) {
      // Owners save their name in hostel_pg_name, while renters use full_name.
      // Use the shared completion check so either role returns after a successful save.
      if (isProfileComplete(profile)) {
        toast.success('Profile completed! Redirecting back...');
        navigate(returnTo, {
          replace: true
        });
      }
    }
  }, [profile, searchParams, navigate]);
  if (loading) {
    return <Layout>
        <div className="w-full h-full min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </Layout>;
  }
  return (
    <Layout>
      <div className="w-full min-h-screen bg-muted/20">
        <div className="w-full max-w-2xl mx-auto px-4 py-5 space-y-5 pb-32">
          {/* Profile Completion Banner */}
          <ProfileCompletionBanner profile={profile} isOwner={isOwner} />

          {isOwner ? (
            <OwnerProfileTabs
              profile={profile}
              user={user}
              formValues={formValues}
              ownerFormValues={ownerFormValues}
              uploadingImage={uploadingImage}
              onInputChange={handleInputChange}
              onOwnerInputChange={handleOwnerInputChange}
              onOwnerSelectChange={handleOwnerSelectChange}
              onImageUpload={handleImageUpload}
              onLocationSaved={handleLocationSaved}
              defaultTab={searchParams.get('tab') || 'basic'}
            />
          ) : (
            <div className="space-y-5">
              {/* Renter Header */}
              <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm">
                <div className="relative p-6 flex flex-col items-center text-center gap-4">
                  <ProfileAvatar
                    profile={profile}
                    userEmail={user?.email}
                    uploadingImage={uploadingImage}
                    onImageUpload={handleImageUpload}
                  />
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {formValues.fullName || 'Your Profile'}
                    </h2>
                    {user?.email && (
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
              </section>

              <ProfileForm
                formValues={formValues}
                profile={profile}
                onInputChange={handleInputChange}
                isOwner={isOwner}
              />
            </div>
          )}

          {/* Property Information for Complete Owner Profiles */}
          {isOwner && profile && isOwnerProfileComplete(profile) && (
            <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-5 sm:p-6">
              <OwnerPropertyDisplay profile={profile} />
            </section>
          )}

          {/* Owner-to-Owner Collaboration */}
          {isOwner && (
            <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-5 sm:p-6">
              <ConnectAnotherProperty />
            </section>
          )}

          {/* Save Action */}
          <div className="pt-2">
            <ProfileActions
              profile={profile}
              saving={saving}
              onSave={handleSave}
              isOwner={isOwner}
            />
          </div>
        </div>
        <StickySaveBar dirty={dirty} saving={saving} onSave={handleSave} />
      </div>
    </Layout>
  );
};
export default Profile;