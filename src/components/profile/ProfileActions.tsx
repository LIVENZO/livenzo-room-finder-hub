
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { isProfileComplete, isOwnerProfileComplete } from '@/utils/profileUtils';
import { UserProfile } from '@/services/UserProfileService';

interface ProfileActionsProps {
  profile: UserProfile | null;
  saving: boolean;
  onSave: () => void;
  isOwner?: boolean;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({ profile, saving, onSave, isOwner = false }) => {
  const basicComplete = isProfileComplete(profile);
  const ownerComplete = isOwner ? isOwnerProfileComplete(profile) : true;
  const fullyComplete = basicComplete && ownerComplete;

  return (
    <div className="flex justify-between">
      <div>
        {!fullyComplete && (
          <p className="text-sm text-amber-600">
            {!basicComplete && "Please complete your basic profile information. "}
            {isOwner && !ownerComplete && "Please complete your property details. "}
            Complete profile required for full access.
          </p>
        )}
      </div>
      <Button onClick={onSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </div>
  );
};

export default ProfileActions;
