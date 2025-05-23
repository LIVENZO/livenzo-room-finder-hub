
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { UserProfile } from '@/services/UserProfileService';

interface ProfileAvatarProps {
  profile: UserProfile | null;
  userEmail?: string;
  uploadingImage: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  profile, 
  userEmail, 
  uploadingImage, 
  onImageUpload 
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar className="h-24 w-24">
        <AvatarImage src={profile?.avatar_url || ''} />
        <AvatarFallback>
          {profile?.full_name?.charAt(0).toUpperCase() || userEmail?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="relative">
        <input
          id="picture"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageUpload}
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
  );
};

export default ProfileAvatar;
