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
  return <div className="w-full space-y-6">
      {/* Status Message */}
      {!fullyComplete}
      
      {/* Save Button */}
      <div className="flex justify-center md:justify-end">
        <Button onClick={onSave} disabled={saving} size="lg" className="w-full md:w-auto px-8 py-3 h-auto text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
          {saving ? <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving Changes...
            </> : 'Save Changes'}
        </Button>
      </div>
    </div>;
};
export default ProfileActions;