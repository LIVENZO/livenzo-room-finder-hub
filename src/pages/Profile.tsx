
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import ProfileCompletionBanner from '@/components/profile/ProfileCompletionBanner';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileForm from '@/components/profile/ProfileForm';
import OwnerPropertyDisplay from '@/components/profile/OwnerPropertyDisplay';
import ProfileActions from '@/components/profile/ProfileActions';
import OwnerProfileTabs from '@/components/profile/OwnerProfileTabs';
import UserIdDisplay from '@/components/profile/UserIdDisplay';
import { useProfileManagement } from '@/hooks/useProfileManagement';
import { isOwnerProfileComplete } from '@/utils/profileUtils';

const Profile = () => {
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
  
  if (loading) {
    return (
      <Layout>
        <div className="container max-w-4xl py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container max-w-4xl py-4 px-4 sm:py-6 md:py-10">
        <ProfileCompletionBanner profile={profile} isOwner={isOwner} />
        
        {/* Show Owner ID prominently for owners */}
        {isOwner && profile?.public_id && (
          <Card className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg text-blue-800">Your Owner ID</CardTitle>
              <CardDescription className="text-sm sm:text-base text-blue-700">
                Share this ID with renters so they can easily connect with you
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <UserIdDisplay publicId={profile.public_id} />
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Your Profile</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Update your personal information and how you appear to others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              />
            ) : (
              <div className="flex flex-col items-center gap-6">
                <ProfileAvatar
                  profile={profile}
                  userEmail={user?.email}
                  uploadingImage={uploadingImage}
                  onImageUpload={handleImageUpload}
                />
                
                <div className="w-full max-w-md">
                  <ProfileForm
                    formValues={formValues}
                    profile={profile}
                    onInputChange={handleInputChange}
                  />
                </div>

                {/* Show Room Number prominently for renters if filled */}
                {!isOwner && formValues.roomNumber && (
                  <div className="w-full max-w-md p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Room Number</div>
                    <div className="text-blue-700">{formValues.roomNumber}</div>
                  </div>
                )}

                {/* Show Public ID for renters */}
                {!isOwner && profile?.public_id && (
                  <div className="w-full max-w-md">
                    <UserIdDisplay publicId={profile.public_id} />
                  </div>
                )}
              </div>
            )}

            {/* Display property information for owners in a read-only format */}
            {isOwner && profile && isOwnerProfileComplete(profile) && (
              <OwnerPropertyDisplay profile={profile} />
            )}
          </CardContent>
          <CardFooter className="pt-4 sm:pt-6">
            <ProfileActions
              profile={profile}
              saving={saving}
              onSave={handleSave}
              isOwner={isOwner}
            />
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
