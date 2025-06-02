
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile, createOrUpdateUserProfile, fetchUserProfile, uploadProfilePicture } from '@/services/UserProfileService';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ProfileCompletionBanner from '@/components/profile/ProfileCompletionBanner';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileForm from '@/components/profile/ProfileForm';
import OwnerPropertyForm from '@/components/profile/OwnerPropertyForm';
import OwnerPropertyDisplay from '@/components/profile/OwnerPropertyDisplay';
import UserIdDisplay from '@/components/profile/UserIdDisplay';
import ProfileActions from '@/components/profile/ProfileActions';
import LocationSetter from '@/components/profile/LocationSetter';
import { isProfileComplete, isOwnerProfileComplete } from '@/utils/profileUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Profile = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formValues, setFormValues] = useState({
    fullName: '',
    phone: '',
    bio: '',
  });

  const [ownerFormValues, setOwnerFormValues] = useState({
    accommodationType: '',
    propertyName: '',
    houseNumber: '',
    totalRentalRooms: '',
    residentType: '',
    propertyLocation: '',
  });
  
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    const loadProfile = async () => {
      setLoading(true);
      const userProfile = await fetchUserProfile(user.id);
      setLoading(false);
      
      if (userProfile) {
        setProfile(userProfile);
        setFormValues({
          fullName: userProfile.full_name || '',
          phone: userProfile.phone || '',
          bio: userProfile.bio || '',
        });
        setOwnerFormValues({
          accommodationType: userProfile.accommodation_type || '',
          propertyName: userProfile.property_name || '',
          houseNumber: userProfile.house_number || '',
          totalRentalRooms: userProfile.total_rental_rooms?.toString() || '',
          residentType: userProfile.resident_type || '',
          propertyLocation: userProfile.property_location || '',
        });
      } else {
        // Create a new profile with basic details
        const newProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        };
        
        setProfile(newProfile as UserProfile);
        setFormValues({
          fullName: newProfile.full_name || '',
          phone: '',
          bio: '',
        });
      }
    };
    
    loadProfile();
  }, [user, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOwnerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOwnerFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOwnerSelectChange = (field: string, value: string) => {
    setOwnerFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    
    const updatedProfile: Partial<UserProfile> & { id: string } = {
      id: user.id,
      full_name: formValues.fullName,
      phone: formValues.phone,
      bio: formValues.bio,
      avatar_url: profile.avatar_url,
    };

    // Add owner-specific fields if user is an owner
    if (isOwner) {
      updatedProfile.accommodation_type = ownerFormValues.accommodationType as 'PG' | 'Hostel' || null;
      updatedProfile.property_name = ownerFormValues.propertyName || null;
      updatedProfile.house_number = ownerFormValues.houseNumber || null;
      updatedProfile.total_rental_rooms = ownerFormValues.totalRentalRooms ? parseInt(ownerFormValues.totalRentalRooms) : null;
      updatedProfile.resident_type = ownerFormValues.residentType as 'Boys' | 'Girls' | 'Both' || null;
      updatedProfile.property_location = ownerFormValues.propertyLocation || null;
    }
    
    const result = await createOrUpdateUserProfile(updatedProfile);
    
    setSaving(false);
    
    if (result) {
      setProfile(result);

      const profileComplete = isProfileComplete(result);
      const ownerProfileComplete = isOwner ? isOwnerProfileComplete(result) : true;
      
      if (profileComplete && ownerProfileComplete) {
        uiToast({
          title: "Profile updated",
          description: "Your profile has been updated and is now complete",
        });
      } else {
        uiToast({
          title: "Profile updated",
          description: "Your profile has been updated but may still be incomplete",
        });
      }
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadingImage(true);
    
    const imageUrl = await uploadProfilePicture(file, user.id);
    
    if (imageUrl) {
      setProfile(prev => prev ? { ...prev, avatar_url: imageUrl } : null);
      
      // Update the profile with the new image URL
      await createOrUpdateUserProfile({
        id: user.id,
        avatar_url: imageUrl,
      });
      
      uiToast({
        title: "Image uploaded",
        description: "Your profile picture has been updated",
      });
    }
    
    setUploadingImage(false);
  };

  const handleLocationSaved = async () => {
    // Refresh profile data after location is saved
    if (user) {
      const updatedProfile = await fetchUserProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    }
  };
  
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
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="property">Property Details</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6">
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

                  {user && (
                    <UserIdDisplay userId={user.id} />
                  )}
                </TabsContent>

                <TabsContent value="property" className="space-y-6">
                  <OwnerPropertyForm
                    formValues={ownerFormValues}
                    profile={profile}
                    onInputChange={handleOwnerInputChange}
                    onSelectChange={handleOwnerSelectChange}
                  />
                </TabsContent>

                <TabsContent value="location" className="space-y-6">
                  {user && (
                    <LocationSetter
                      userId={user.id}
                      profile={profile}
                      onLocationSaved={handleLocationSaved}
                    />
                  )}
                </TabsContent>
              </Tabs>
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
