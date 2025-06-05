
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { UserProfile } from '@/services/UserProfileService';
import { toast } from 'sonner';

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
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, or WebP)');
      e.target.value = ''; // Clear the input
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      e.target.value = ''; // Clear the input
      return;
    }

    console.log('File validation passed:', { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });

    // File is valid, proceed with upload
    onImageUpload(e);
  };

  // Create a cache-busting image URL to force refresh
  const imageUrl = profile?.avatar_url ? 
    (profile.avatar_url.includes('?') ? profile.avatar_url : `${profile.avatar_url}?t=${Date.now()}`) : 
    '';

  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar className="h-24 w-24">
        <AvatarImage 
          src={imageUrl} 
          key={imageUrl} // Force re-render when URL changes
          onLoad={() => console.log('Avatar image loaded:', imageUrl)}
          onError={() => console.log('Avatar image failed to load:', imageUrl)}
        />
        <AvatarFallback>
          {profile?.full_name?.charAt(0).toUpperCase() || userEmail?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="relative">
        <input
          id="picture"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
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
      {!uploadingImage && (
        <p className="text-xs text-gray-500 text-center max-w-[120px]">
          JPG, PNG or WebP (max 5MB)
        </p>
      )}
    </div>
  );
};

export default ProfileAvatar;
