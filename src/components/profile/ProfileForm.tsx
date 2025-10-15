
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
  isOwner?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ formValues, profile, onInputChange, onSecurityIssue, isOwner = false }) => {
  
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
    <div className="w-full space-y-8">
      {/* Name Field - Conditional for Owner/Renter */}
      <div className="space-y-3">
        <Label htmlFor="fullName" className="text-base font-semibold text-foreground">
          {isOwner ? 'Hostel/PG Name' : 'Name'} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fullName"
          name="fullName"
          value={formValues.fullName}
          onChange={handleSecureInputChange}
          placeholder={isOwner ? "Your hostel or PG name" : "Your full name"}
          className={`h-12 text-base ${!formValues.fullName ? "border-destructive/50 focus-visible:ring-destructive/20" : ""}`}
          required
        />
        {!formValues.fullName && (
          <p className="text-sm text-destructive font-medium">
            {isOwner ? 'Hostel/PG name' : 'Name'} is required to complete your profile
          </p>
        )}
      </div>
      
      {/* Phone Number Field */}
      <div className="space-y-3">
        <Label htmlFor="phone" className="text-base font-semibold text-foreground">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formValues.phone}
          onChange={handleSecureInputChange}
          placeholder="Your phone number"
          className={`h-12 text-base ${!formValues.phone ? "border-destructive/50 focus-visible:ring-destructive/20" : ""}`}
          required
        />
        {!formValues.phone && (
          <p className="text-sm text-destructive font-medium">Phone number is required to complete your profile</p>
        )}
      </div>

      {/* House/Room No. Field */}
      <div className="space-y-3">
        <Label htmlFor="roomNumber" className="text-base font-semibold text-foreground">
          {isOwner ? 'House No.' : 'Room No.'}
        </Label>
        <Input
          id="roomNumber"
          name="roomNumber"
          value={formValues.roomNumber}
          onChange={handleSecureInputChange}
          placeholder="e.g., 202, A-101, 15B"
          className="h-12 text-base"
        />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Optional: Specify your {isOwner ? 'house' : 'room'} number for easier identification
        </p>
      </div>
      
      {/* Bio Field */}
      <div className="space-y-3">
        <Label htmlFor="bio" className="text-base font-semibold text-foreground">
          About You
        </Label>
        <Textarea
          id="bio"
          name="bio"
          value={formValues.bio}
          onChange={handleSecureInputChange}
          placeholder="Tell others a bit about yourself"
          rows={4}
          className="text-base leading-relaxed resize-none"
        />
      </div>
    </div>
  );
};

export default ProfileForm;
