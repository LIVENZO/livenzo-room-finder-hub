import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface EmailOTPFormProps {
  onSendOTP: (email: string) => Promise<void>;
  onVerifyOTP: (email: string, token: string) => Promise<void>;
  isLoading: boolean;
}

const EmailOTPForm: React.FC<EmailOTPFormProps> = ({ 
  onSendOTP, 
  onVerifyOTP, 
  isLoading 
}) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      await onSendOTP(email);
      setOtpSent(true);
      toast.success('OTP sent! Please check your email.');
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
      await onVerifyOTP(email, otp);
    } catch (error) {
      // Error handling is done in the auth method
    }
  };

  const handleBackToEmail = () => {
    setOtpSent(false);
    setOtp('');
  };

  if (!otpSent) {
    return (
      <div className="space-y-4">
        <form onSubmit={handleSendOTP} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="pl-10"
            />
          </div>

          <Button 
            type="submit"
            className="w-full"
            disabled={isLoading || !email.trim()}
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
          We sent a 6-digit code to {email}
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
          onClick={handleBackToEmail}
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
          disabled={isLoading}
        >
          Back to email
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

export default EmailOTPForm;