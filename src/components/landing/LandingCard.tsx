import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import RoleSelector from './RoleSelector';
import SocialLoginButtons from './SocialLoginButtons';
import OTPVerificationModal from './OTPVerificationModal';
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
      toast.error('Failed to send OTP. Please try again.');
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
  return <>
      <div className="w-full bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg space-y-6">
        <div className="space-y-2 text-center">
          {/* Title and description can be added here if needed */}
        </div>
        
        <RoleSelector userRole={userRole} setUserRole={setUserRole} canChangeRole={canChangeRole} />
        
        {/* Phone Number Input Section */}
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="w-full">
            <Input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={handlePhoneChange} disabled={isLoading} className="w-full h-12 text-base rounded-xl" maxLength={10} />
          </div>

          <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold rounded-xl" disabled={isLoading || !phoneNumber.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send OTP
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          
        </div>
        
        <SocialLoginButtons onGoogleLogin={handleGoogleLogin} onFacebookLogin={handleFacebookLogin} isLoading={isLoading} />
      </div>

      {/* OTP Verification Modal */}
      <OTPVerificationModal isOpen={otpModalOpen} onClose={handleCloseOTPModal} phoneNumber={phoneNumber} isLoading={isLoading} onVerifyOTP={handleVerifyOTP} onResendOTP={handleResendOTP} />
    </>;
};
export default LandingCard;