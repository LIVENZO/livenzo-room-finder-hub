import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserProfile } from '@/services/UserProfileService';
import { EnhancedValidator } from '@/services/security/enhancedValidation';
import { securityMonitor } from '@/services/security/securityMonitor';
import { toast } from 'sonner';
import { User, Phone, Home, FileText } from 'lucide-react';

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

const inputClasses =
  'h-12 text-base rounded-xl border-border bg-background focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40 transition';

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <section className="rounded-2xl bg-card border border-border/60 shadow-sm p-5 sm:p-6 space-y-5">
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground leading-tight">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="space-y-5">{children}</div>
  </section>
);

const ProfileForm: React.FC<ProfileFormProps> = ({
  formValues,
  profile,
  onInputChange,
  onSecurityIssue,
  isOwner = false,
}) => {
  const handleSecureInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let validationResult;
    if (name === 'fullName') {
      validationResult = EnhancedValidator.validateName(value, false);
    } else if (name === 'phone') {
      validationResult = EnhancedValidator.validatePhone(value, false);
    } else if (name === 'bio') {
      validationResult = EnhancedValidator.validateDescription(value, false);
    } else {
      validationResult = EnhancedValidator.validateAndSanitize(value, 'safeName', {
        required: false,
      });
    }

    if (validationResult.securityIssue) {
      securityMonitor.logSuspiciousActivity('form_injection_attempt', {
        field: name,
        value: value.substring(0, 50),
        action: 'profile_form_input',
      });
      toast.error('Invalid input detected. Please check your input and try again.');
      onSecurityIssue?.(name, validationResult.error || 'Security issue detected');
      return;
    }

    onInputChange(e);
  };

  return (
    <div className="w-full space-y-5">
      {/* Basic Information */}
      <SectionCard
        icon={<User className="h-5 w-5 text-primary" />}
        title="Basic Information"
        subtitle={isOwner ? 'Your identity on Livenzo' : 'Tell us who you are'}
      >
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            value={formValues.fullName}
            onChange={handleSecureInputChange}
            placeholder={isOwner ? 'Your name' : 'Your full name'}
            className={`${inputClasses} ${!formValues.fullName ? 'border-destructive/50 focus-visible:ring-destructive/20' : ''}`}
            required
          />
          {!formValues.fullName && (
            <p className="text-xs text-destructive">Name is required</p>
          )}
        </div>

        {!isOwner && (
          <div className="space-y-2">
            <Label htmlFor="roomNumber" className="text-sm font-medium text-foreground">
              Room No.<span className="text-destructive"> *</span>
            </Label>
            <div className="relative">
              <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="roomNumber"
                name="roomNumber"
                value={formValues.roomNumber}
                onChange={handleSecureInputChange}
                placeholder="e.g., 202, A-101, 15B"
                className={`${inputClasses} pl-10 ${!formValues.roomNumber ? 'border-destructive/50 focus-visible:ring-destructive/20' : ''}`}
                required
              />
            </div>
            {!formValues.roomNumber ? (
              <p className="text-xs text-destructive">Please enter your Room Number</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Required so your owner can identify your room
              </p>
            )}
          </div>
        )}
      </SectionCard>

      {/* Contact */}
      <SectionCard
        icon={<Phone className="h-5 w-5 text-primary" />}
        title="Contact"
        subtitle="How people can reach you"
      >
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-foreground">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formValues.phone}
            onChange={handleSecureInputChange}
            placeholder="Your phone number"
            className={`${inputClasses} ${!formValues.phone ? 'border-destructive/50 focus-visible:ring-destructive/20' : ''}`}
            required
          />
          {!formValues.phone && (
            <p className="text-xs text-destructive">Phone number is required</p>
          )}
        </div>
      </SectionCard>

      {/* About */}
      <SectionCard
        icon={<FileText className="h-5 w-5 text-primary" />}
        title="About You"
        subtitle="A short intro shown on your profile"
      >
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-medium text-foreground">
            Bio
          </Label>
          <Textarea
            id="bio"
            name="bio"
            value={formValues.bio}
            onChange={handleSecureInputChange}
            placeholder="Tell others a bit about yourself"
            rows={4}
            className="text-base leading-relaxed resize-none rounded-xl bg-background focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default ProfileForm;
