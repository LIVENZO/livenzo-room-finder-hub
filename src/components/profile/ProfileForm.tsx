
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { isProfileComplete } from '@/utils/profileUtils';
import { UserProfile } from '@/services/UserProfileService';
import { EnhancedValidator } from '@/services/security/enhancedValidation';
import { securityMonitor } from '@/services/security/securityMonitor';
import { toast } from 'sonner';

interface ProfileFormProps {
  formValues: {
    fullName: string;
    phone: string;
    bio: string;
    roomNumber: string;
  };
  profile: UserProfile | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSecurityIssue?: (field: string, issue: string) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ formValues, profile, onInputChange, onSecurityIssue }) => {
  
  // Enhanced input change handler with security validation
  const handleSecureInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validate input based on field type - allowing normal input
    let validationResult;
    if (name === 'fullName') {
      validationResult = EnhancedValidator.validateName(value, false); // Not required during typing
    } else if (name === 'phone') {
      validationResult = EnhancedValidator.validatePhone(value, false); // Not required during typing
    } else if (name === 'bio') {
      validationResult = EnhancedValidator.validateDescription(value, false);
    } else {
      validationResult = EnhancedValidator.validateAndSanitize(value, 'safeName', { required: false });
    }
    
    // Only block for serious security issues, allow normal typing
    if (validationResult.securityIssue) {
      securityMonitor.logSuspiciousActivity('form_injection_attempt', {
        field: name,
        value: value.substring(0, 50),
        action: 'profile_form_input'
      });
      toast.error('Invalid input detected. Please check your input and try again.');
      onSecurityIssue?.(name, validationResult.error || 'Security issue detected');
      return;
    }
    
    // Allow input to pass through, only validate on save
    onInputChange(e);
  };
  return (
    <div className="w-full space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="fullName">Name <span className="text-red-500">*</span></Label>
        <Input
          id="fullName"
          name="fullName"
          value={formValues.fullName}
          onChange={handleSecureInputChange}
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
          onChange={handleSecureInputChange}
          placeholder="Your phone number"
          className={!formValues.phone ? "border-red-300" : ""}
          required
        />
        {!formValues.phone && (
          <p className="text-xs text-red-500">Phone number is required to complete your profile</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="roomNumber">Room Number</Label>
        <Input
          id="roomNumber"
          name="roomNumber"
          value={formValues.roomNumber}
          onChange={handleSecureInputChange}
          placeholder="e.g., Room 202, A-101"
        />
        <p className="text-xs text-muted-foreground">Optional: Specify your room number for easier identification</p>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="bio">About You</Label>
        <Textarea
          id="bio"
          name="bio"
          value={formValues.bio}
          onChange={handleSecureInputChange}
          placeholder="Tell others a bit about yourself"
          rows={3}
        />
      </div>
    </div>
  );
};

export default ProfileForm;
