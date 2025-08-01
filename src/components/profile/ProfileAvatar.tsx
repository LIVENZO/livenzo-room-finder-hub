
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
    <div className="flex flex-col items-center gap-6">
      {/* Avatar with enhanced styling */}
      <div className="relative">
        <Avatar className="h-32 w-32 md:h-36 md:w-36 ring-4 ring-primary/10 shadow-xl">
          <AvatarImage 
            src={imageUrl} 
            key={imageUrl} // Force re-render when URL changes
            className="object-cover"
            onLoad={() => console.log('Avatar image loaded:', imageUrl)}
            onError={() => console.log('Avatar image failed to load:', imageUrl)}
          />
          <AvatarFallback className="text-3xl font-semibold bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground">
            {profile?.full_name?.charAt(0).toUpperCase() || userEmail?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload indicator overlay */}
        {uploadingImage && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Upload Button */}
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
          size="lg"
          variant="outline"
          className="text-base font-medium px-6 py-3 h-auto shadow-md hover:shadow-lg transition-all duration-200"
          onClick={() => document.getElementById('picture')?.click()}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" /> Change Picture
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfileAvatar;
