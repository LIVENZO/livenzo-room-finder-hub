
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
        <div className="w-full min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="w-full min-h-screen">
        <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
          {/* Profile Completion Banner */}
          <ProfileCompletionBanner profile={profile} isOwner={isOwner} />
          
          
          {/* Main Profile Card */}
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-8 text-center md:text-left">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Your Profile
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground leading-relaxed mt-2">
                Update your personal information and how you appear to others
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-10">
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
                <div className="space-y-8">
                  {/* Profile Avatar Section */}
                  <div className="flex justify-center">
                    <ProfileAvatar
                      profile={profile}
                      userEmail={user?.email}
                      uploadingImage={uploadingImage}
                      onImageUpload={handleImageUpload}
                    />
                  </div>
                  
                  {/* Profile Form Section */}
                  <div className="max-w-2xl mx-auto">
                    <ProfileForm
                      formValues={formValues}
                      profile={profile}
                      onInputChange={handleInputChange}
                    />
                  </div>

                  {/* Room Number Display */}
                  {!isOwner && formValues.roomNumber && (
                    <div className="max-w-2xl mx-auto">
                      <Card className="bg-secondary/30 border-secondary shadow-sm">
                        <CardContent className="p-6">
                          <div className="text-sm font-semibold text-secondary-foreground mb-2 uppercase tracking-wide">
                            Room Number
                          </div>
                          <div className="text-lg font-medium text-foreground">
                            {formValues.roomNumber}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* Property Information for Complete Owner Profiles */}
              {isOwner && profile && isOwnerProfileComplete(profile) && (
                <div className="border-t pt-8">
                  <OwnerPropertyDisplay profile={profile} />
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-8 pb-8 bg-muted/20">
              <div className="w-full">
                <ProfileActions
                  profile={profile}
                  saving={saving}
                  onSave={handleSave}
                  isOwner={isOwner}
                />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
