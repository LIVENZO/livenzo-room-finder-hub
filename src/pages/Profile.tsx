
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
import UserIdDisplay from '@/components/profile/UserIdDisplay';
import ProfileActions from '@/components/profile/ProfileActions';
import { isProfileComplete } from '@/utils/profileUtils';

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
  
  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    
    const updatedProfile = await createOrUpdateUserProfile({
      id: user.id,
      full_name: formValues.fullName,
      phone: formValues.phone,
      bio: formValues.bio,
      avatar_url: profile.avatar_url,
    });
    
    setSaving(false);
    
    if (updatedProfile) {
      setProfile(updatedProfile);

      const profileComplete = isProfileComplete(updatedProfile);
      if (profileComplete) {
        uiToast({
          title: "Profile updated",
          description: "Your profile has been updated and is now complete",
        });
      } else {
        uiToast({
          title: "Profile updated",
          description: "Your profile has been updated but is still incomplete",
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
        <ProfileCompletionBanner profile={profile} />
        
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Update your personal information and how you appear to others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {isOwner && user && (
              <UserIdDisplay userId={user.id} />
            )}
          </CardContent>
          <CardFooter>
            <ProfileActions
              profile={profile}
              saving={saving}
              onSave={handleSave}
            />
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
