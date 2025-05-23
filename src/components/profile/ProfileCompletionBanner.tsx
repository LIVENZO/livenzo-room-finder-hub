
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile } from '@/services/UserProfileService';
import { isProfileComplete } from '@/utils/profileUtils';

interface ProfileCompletionBannerProps {
  profile: UserProfile | null;
}

const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ profile }) => {
  const complete = isProfileComplete(profile);
  
  if (complete) {
    return (
      <Alert className="bg-green-50 border-green-200 mb-6">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700">Profile Complete</AlertTitle>
        <AlertDescription className="text-green-600">
          Your profile is complete and you can access all features of the application.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert className="bg-amber-50 border-amber-200 mb-6">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700">Profile Incomplete</AlertTitle>
      <AlertDescription className="text-amber-600">
        Please complete your profile to unlock all features. At minimum, you need to add your name and phone number.
      </AlertDescription>
    </Alert>
  );
};

export default ProfileCompletionBanner;
