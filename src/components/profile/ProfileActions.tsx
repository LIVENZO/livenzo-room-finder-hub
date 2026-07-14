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
const ProfileActions: React.FC<ProfileActionsProps> = ({
  profile,
  saving,
  onSave,
  isOwner = false
}) => {
  const basicComplete = isProfileComplete(profile);
  const ownerComplete = isOwner ? isOwnerProfileComplete(profile) : true;
  // Actions enablement depends on basic profile only
  const fullyComplete = basicComplete;
  return (
    <div className="w-full">
      <Button
        onClick={onSave}
        disabled={saving}
        className="w-full h-14 rounded-2xl text-base font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
      >
        {saving ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving Changes...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </div>
  );
};
export default ProfileActions;