
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { isProfileComplete } from '@/utils/profileUtils';
import { UserProfile } from '@/services/UserProfileService';

interface ProfileFormProps {
  formValues: {
    fullName: string;
    phone: string;
    bio: string;
  };
  profile: UserProfile | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ formValues, profile, onInputChange }) => {
  return (
    <div className="w-full space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="fullName">Name <span className="text-red-500">*</span></Label>
        <Input
          id="fullName"
          name="fullName"
          value={formValues.fullName}
          onChange={onInputChange}
          placeholder="Your full name"
          className={!formValues.fullName ? "border-red-300" : ""}
          required
        />
        {!formValues.fullName && (
          <p className="text-xs text-red-500">Name is required to complete your profile</p>
        )}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formValues.phone}
          onChange={onInputChange}
          placeholder="Your phone number"
          className={!formValues.phone ? "border-red-300" : ""}
          required
        />
        {!formValues.phone && (
          <p className="text-xs text-red-500">Phone number is required to complete your profile</p>
        )}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="bio">About You</Label>
        <Textarea
          id="bio"
          name="bio"
          value={formValues.bio}
          onChange={onInputChange}
          placeholder="Tell others a bit about yourself"
          rows={4}
        />
      </div>
    </div>
  );
};

export default ProfileForm;
