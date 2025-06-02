
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
      <div className="container max-w-4xl py-10">
        <ProfileCompletionBanner profile={profile} isOwner={isOwner} />
        
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
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
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <ProfileAvatar
                  profile={profile}
                  userEmail={user?.email}
                  uploadingImage={uploadingImage}
                  onImageUpload={handleImageUpload}
                />
                
                <ProfileForm
                  formValues={formValues}
                  profile={profile}
                  onInputChange={handleInputChange}
                />
              </div>
            )}

            {/* Display property information for owners in a read-only format */}
            {isOwner && profile && isOwnerProfileComplete(profile) && (
              <OwnerPropertyDisplay profile={profile} />
            )}
          </CardContent>
          <CardFooter>
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
