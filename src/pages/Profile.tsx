
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile, createOrUpdateUserProfile, fetchUserProfile, uploadProfilePicture } from '@/services/UserProfileService';
import { useNavigate } from 'react-router-dom';
import { Loader2, Upload, Copy } from 'lucide-react';
import { toast } from 'sonner';
import ProfileCompletionBanner from '@/components/profile/ProfileCompletionBanner';
import { isProfileComplete } from '@/utils/profileUtils';

const Profile = () => {
  const { user, userRole, isOwner } = useAuth();
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

  const copyUserIdToClipboard = () => {
    if (user) {
      navigator.clipboard.writeText(user.id);
      toast.success("User ID copied to clipboard");
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
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="relative">
                  <input
                    id="picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => document.getElementById('picture')?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1" /> Change Picture
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="w-full space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formValues.fullName}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className={!formValues.fullName ? "border-red-300" : ""}
                    required
                  />
                  {!formValues.fullName && (
                    <p className="text-xs text-red-500">Name is required to complete your profile</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formValues.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                    className={!formValues.phone ? "border-red-300" : ""}
                    required
                  />
                  {!formValues.phone && (
                    <p className="text-xs text-red-500">Phone number is required to complete your profile</p>
                  )}
                </div>

                {isOwner && (
                  <div className="grid gap-2">
                    <Label htmlFor="userId">Your User ID (for renters to find you)</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="userId"
                        value={user?.id || ''}
                        readOnly
                        className="bg-gray-50 font-mono text-sm"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={copyUserIdToClipboard}
                        title="Copy ID to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Share this ID with potential renters so they can connect with you
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formValues.bio}
                onChange={handleInputChange}
                placeholder="Tell others a bit about yourself"
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {!isProfileComplete(profile) && (
                <p className="text-sm text-amber-600">
                  Please complete your profile to unlock all features
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
