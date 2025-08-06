import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface PhoneOTPFormProps {
  onSendOTP: (phoneNumber: string) => Promise<void>;
  onVerifyOTP: (phoneNumber: string, token: string) => Promise<void>;
  isLoading: boolean;
}

const PhoneOTPForm: React.FC<PhoneOTPFormProps> = ({ 
  onSendOTP, 
  onVerifyOTP, 
  isLoading 
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Add + if it doesn't start with it and there are digits
    if (cleaned.length > 0 && !value.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return value;
  };

  const validatePhoneNumber = (phone: string) => {
    // Basic validation - should start with + and have at least 10 digits
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    try {
      await onSendOTP(phoneNumber);
      setOtpSent(true);
      toast.success('OTP sent! Please check your messages.');
    } catch (error) {
      // Error handling is done in the auth method
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim() || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    try {
      await onVerifyOTP(phoneNumber, otp);
    } catch (error) {
      // Error handling is done in the auth method
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtp('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  if (!otpSent) {
    return (
      <div className="space-y-4">
        <form onSubmit={handleSendOTP} className="space-y-3">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="Enter phone number (+123456789)"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={isLoading}
              className="pl-10"
            />
          </div>

          <Button 
            type="submit"
            className="w-full"
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Send OTP
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium">Enter OTP</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We sent a 6-digit code to {phoneNumber}
        </p>
      </div>

      <form onSubmit={handleVerifyOTP} className="space-y-3">
        <div className="flex justify-center">
          <InputOTP value={otp} onChange={setOtp} maxLength={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          type="submit"
          className="w-full"
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Verify OTP
        </Button>
      </form>

      <div className="flex flex-col space-y-2 text-center">
        <button
          type="button"
          onClick={handleBackToPhone}
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
          disabled={isLoading}
        >
          Back to phone number
        </button>
        
        <button
          type="button"
          onClick={() => handleSendOTP({ preventDefault: () => {} } as React.FormEvent)}
          className="text-sm text-primary hover:underline"
          disabled={isLoading}
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
};

export default PhoneOTPForm;