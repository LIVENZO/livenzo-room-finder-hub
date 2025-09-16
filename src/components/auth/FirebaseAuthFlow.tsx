import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebaseAuthFlow } from '@/hooks/useFirebaseAuthFlow';
import { Loader2, Phone, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface FirebaseAuthFlowProps {
  onAuthSuccess?: () => void;
}

export const FirebaseAuthFlow: React.FC<FirebaseAuthFlowProps> = ({ onAuthSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const { isLoading, error, sendOTP, verifyOTP, clearError } = useFirebaseAuthFlow();

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      // Ensure phone number has country code
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      await sendOTP(formattedPhone);
      setStep('otp');
      toast.success('OTP sent successfully!');
    } catch (err) {
      console.error('Error sending OTP:', err);
      toast.error(error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    try {
      await verifyOTP(otp);
      toast.success('Authentication successful!');
      onAuthSuccess?.();
    } catch (err) {
      console.error('Error verifying OTP:', err);
      toast.error(error || 'Invalid OTP');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setPhoneNumber(value);
    if (error) clearError();
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Max 6 digits
    setOtp(value);
    if (error) clearError();
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    clearError();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          {step === 'phone' ? (
            <Phone className="h-6 w-6 text-primary" />
          ) : (
            <Shield className="h-6 w-6 text-primary" />
          )}
        </div>
        <CardTitle>
          {step === 'phone' ? 'Enter Phone Number' : 'Verify OTP'}
        </CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? 'We\'ll send you a verification code' 
            : `Enter the 6-digit code sent to ${phoneNumber}`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="pl-12"
                  disabled={isLoading}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  +91
                </span>
              </div>
            </div>
            
            <Button 
              onClick={handleSendOTP} 
              disabled={!phoneNumber.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              onClick={handleVerifyOTP} 
              disabled={otp.length !== 6 || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleBackToPhone}
              className="w-full"
              disabled={isLoading}
            >
              Change Phone Number
            </Button>
          </>
        )}
        
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};