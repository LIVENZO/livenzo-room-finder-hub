import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SocialLoginButtons from './SocialLoginButtons';
import OTPVerificationModal from './OTPVerificationModal';
import livenzoIcon from '@/assets/livenzo-icon.png.asset.json';

interface LandingCardProps {
  userRole: string;
  setUserRole: (role: string) => void;
  canChangeRole: boolean;
  isLoading: boolean;
  handleGoogleLogin: () => void;
  handleFacebookLogin: () => void;
  handleOTPAuth: {
    sendOTP: (phoneNumber: string) => Promise<void>;
    verifyOTP: (phoneNumber: string, token: string) => Promise<void>;
  };
}

const LandingCard: React.FC<LandingCardProps> = ({
  userRole,
  setUserRole,
  canChangeRole,
  isLoading,
  handleGoogleLogin,
  handleFacebookLogin,
  handleOTPAuth
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');

    // Limit to 10 digits for Indian numbers
    if (cleaned.length > 10) {
      return cleaned.substring(0, 10);
    }
    return cleaned;
  };

  const validatePhoneNumber = (phone: string) => {
    // Validate 10-digit Indian phone number
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const getFullPhoneNumber = (phone: string) => {
    // Always add +91 prefix for Indian numbers
    return `+91${phone}`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    const fullPhoneNumber = getFullPhoneNumber(phoneNumber);
    try {
      await handleOTPAuth.sendOTP(fullPhoneNumber);
      toast.success('OTP sent successfully!');
      // Immediately open OTP verification modal
      setOtpModalOpen(true);
    } catch (error) {
      console.error('Failed to send OTP:', error);
      toast.error("Service temporarily unavailable. We are currently experiencing high traffic and OTP delivery may be delayed. Please try again after a few minutes.");
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    const fullPhoneNumber = getFullPhoneNumber(phoneNumber);
    try {
      await handleOTPAuth.verifyOTP(fullPhoneNumber, otp);
      setOtpModalOpen(false);
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      throw error; // Let the modal handle the error display
    }
  };

  const handleResendOTP = async () => {
    const fullPhoneNumber = getFullPhoneNumber(phoneNumber);
    await handleOTPAuth.sendOTP(fullPhoneNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleCloseOTPModal = () => {
    setOtpModalOpen(false);
  };

  return (
    <>
      <div className="w-full rounded-[2rem] border border-primary/10 bg-card/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_60px_-20px_rgba(91,60,196,0.18),0_8px_24px_-12px_rgba(0,0,0,0.08)] space-y-5">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/25 to-secondary/25 blur-md" />
            <img
              src={livenzoIcon.url}
              alt="Livenzo"
              width={72}
              height={72}
              className="relative h-[4.5rem] w-[4.5rem] object-contain rounded-3xl"
            />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground font-display">
              Log in or sign up
            </h1>
            <p className="text-sm text-muted-foreground">
              Find your perfect room in Kota
            </p>
          </div>
        </div>

        {/* Phone Number Input Section */}
        <form onSubmit={handleSendOTP} className="space-y-3.5">
          <div className="flex items-center h-14 w-full rounded-2xl border border-input bg-background/80 focus-within:border-primary/60 focus-within:ring-[3px] focus-within:ring-primary/10 transition-all duration-200 overflow-hidden">
            <span className="pl-4 pr-3 text-base font-semibold text-foreground select-none">+91</span>
            <span className="h-6 w-px bg-border" />
            <Input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="Phone number"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={isLoading}
              className="flex-1 h-14 border-0 bg-transparent text-base tracking-wide placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              maxLength={10}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary-600 shadow-[0_8px_24px_-8px_rgba(91,60,196,0.45)] hover:shadow-[0_10px_28px_-8px_rgba(91,60,196,0.55)] hover:brightness-105 transition-all duration-200 disabled:opacity-70"
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send OTP
          </Button>
        </form>

        <p className="text-[11px] leading-relaxed text-center text-muted-foreground/80 px-2">
          By continuing, you agree to Livenzo's Terms of Service and Privacy Policy.
        </p>

        <div className="hidden">
          <SocialLoginButtons onGoogleLogin={handleGoogleLogin} onFacebookLogin={handleFacebookLogin} isLoading={isLoading} />
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OTPVerificationModal isOpen={otpModalOpen} onClose={handleCloseOTPModal} phoneNumber={phoneNumber} isLoading={isLoading} onVerifyOTP={handleVerifyOTP} onResendOTP={handleResendOTP} />
    </>
  );
};

export default LandingCard;
