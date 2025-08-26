
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile } from '@/services/UserProfileService';
import { isProfileComplete, isOwnerProfileComplete } from '@/utils/profileUtils';

interface ProfileCompletionBannerProps {
  profile: UserProfile | null;
  isOwner?: boolean;
}

const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ profile, isOwner = false }) => {
  const basicComplete = isProfileComplete(profile);
  const ownerComplete = isOwner ? isOwnerProfileComplete(profile) : true;
  // For banner, consider basic profile completion only; owner details are optional
  const fullyComplete = basicComplete;
  
  if (fullyComplete) {
    return (
      <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
        <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
        <span className="text-green-700 font-medium">Profile Complete</span>
      </div>
    );
  }
  
  let missingFields = [];
  if (!basicComplete) {
    missingFields.push("name and phone number");
  }
  if (isOwner && !ownerComplete) {
    missingFields.push("property details");
  }
  
  return (
    <Alert className="bg-amber-50 border-amber-200 mb-6">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700">Profile Incomplete</AlertTitle>
      <AlertDescription className="text-amber-600">
        { !basicComplete ? (
          <>Please complete your name and phone number to unlock account features.</>
        ) : (
          isOwner && !ownerComplete && <>Property details are optional and only required when listing rooms or managing connections.</>
        ) }
      </AlertDescription>
    </Alert>
  );
};

export default ProfileCompletionBanner;
