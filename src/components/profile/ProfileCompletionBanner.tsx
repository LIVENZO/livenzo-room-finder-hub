
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
  const fullyComplete = basicComplete && ownerComplete;
  
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
        Please complete your {missingFields.join(" and ")} to unlock all features.
        {isOwner && " Property details are required for listing rooms and managing connections."}
      </AlertDescription>
    </Alert>
  );
};

export default ProfileCompletionBanner;
