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

  return (
    <div className="space-y-6">
      {/* Phone Number Input Section */}
      <form onSubmit={handleSendOTP} className="space-y-3">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="Enter phone number (+123456789)"
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={isLoading || otpSent}
            className="pl-10"
          />
        </div>

        <Button 
          type="submit"
          className="w-full"
          disabled={isLoading || !phoneNumber.trim() || otpSent}
        >
          {isLoading && !otpSent ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Send OTP
        </Button>
      </form>

      {/* OTP Verification Section - Shows after OTP is sent */}
      {otpSent && (
        <div className="bg-card/50 rounded-2xl border p-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Verify Your Phone</h3>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit OTP sent to your phone
            </p>
            <p className="text-sm font-medium text-primary">
              {phoneNumber}
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center">
              <InputOTP 
                value={otp} 
                onChange={setOtp} 
                maxLength={6}
                className="gap-2"
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot 
                    index={0} 
                    className="w-12 h-12 text-lg font-bold rounded-xl border-2 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={1} 
                    className="w-12 h-12 text-lg font-bold rounded-xl border-2 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={2} 
                    className="w-12 h-12 text-lg font-bold rounded-xl border-2 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={3} 
                    className="w-12 h-12 text-lg font-bold rounded-xl border-2 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={4} 
                    className="w-12 h-12 text-lg font-bold rounded-xl border-2 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                  <InputOTPSlot 
                    index={5} 
                    className="w-12 h-12 text-lg font-bold rounded-xl border-2 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Verify Button */}
            <Button 
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading && otpSent ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              Verify OTP
            </Button>
          </form>

          {/* Footer Actions */}
          <div className="text-center space-y-3">
            <button
              type="button"
              onClick={() => handleSendOTP({ preventDefault: () => {} } as React.FormEvent)}
              className="text-primary text-sm font-medium hover:underline transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Resend OTP
            </button>
            
            <button
              type="button"
              onClick={handleBackToPhone}
              className="block w-full text-xs text-muted-foreground hover:text-primary transition-colors"
              disabled={isLoading}
            >
              ← Use different phone number
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneOTPForm;