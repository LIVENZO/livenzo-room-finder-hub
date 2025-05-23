
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { isProfileComplete } from '@/utils/profileUtils';
import { UserProfile } from '@/services/UserProfileService';

interface ProfileActionsProps {
  profile: UserProfile | null;
  saving: boolean;
  onSave: () => void;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({ profile, saving, onSave }) => {
  return (
    <div className="flex justify-between">
      <div>
        {!isProfileComplete(profile) && (
          <p className="text-sm text-amber-600">
            Please complete your profile to unlock all features
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
