import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  isLoading: boolean;
  onVerifyOTP: (otp: string) => Promise<void>;
  onResendOTP: () => Promise<void>;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  phoneNumber,
  isLoading,
  onVerifyOTP,
  onResendOTP
}) => {
  const [otp, setOtp] = useState('');

  // Clear OTP when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
    }
  }, [isOpen]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    try {
      await onVerifyOTP(otp);
    } catch (error) {
      console.error('Failed to verify OTP:', error);
    }
  };

  const handleResendOTP = async () => {
    try {
      await onResendOTP();
      toast.success('OTP resent successfully!');
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md mx-auto p-0 bg-background border border-border/20 shadow-xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 h-8 w-8 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Verify OTP
              </DialogTitle>
            </div>
          </div>

          {/* Phone number display */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to
            </p>
            <p className="text-base font-medium text-foreground mt-1">
              +91{phoneNumber}
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* OTP Input */}
            <div className="flex justify-center">
              <InputOTP 
                value={otp} 
                onChange={setOtp} 
                maxLength={6} 
                autoFocus 
                className="gap-2"
                pattern="[0-9]*"
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map(index => 
                    <InputOTPSlot 
                      key={index} 
                      index={index} 
                      className="w-12 h-12 text-lg font-bold rounded-xl border-2 border-input bg-background transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50" 
                    />
                  )}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Verify Button */}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 text-base font-semibold rounded-xl" 
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify OTP
            </Button>
          </form>

          {/* Resend OTP */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <button 
              type="button" 
              onClick={handleResendOTP}
              className="text-primary text-sm font-medium hover:underline transition-colors disabled:opacity-50" 
              disabled={isLoading}
            >
              Resend OTP
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPVerificationModal;