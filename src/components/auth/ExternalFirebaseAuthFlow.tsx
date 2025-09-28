import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExternalFirebaseAuth } from '@/hooks/useExternalFirebaseAuth';
import { Loader2, Phone, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface ExternalFirebaseAuthFlowProps {
  onAuthSuccess?: () => void;
}

export const ExternalFirebaseAuthFlow: React.FC<ExternalFirebaseAuthFlowProps> = ({ onAuthSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const { isLoading, error, sendOTP, verifyOTP, clearError } = useExternalFirebaseAuth();

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

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const formattedPhone = getFullPhoneNumber(phoneNumber);
      await sendOTP(formattedPhone);
      setStep('otp');
      toast.success('OTP sent successfully!');
    } catch (err) {
      console.error('Error sending OTP:', err);
      toast.error(error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
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
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (error) clearError();
  };

  const handleOtpChange = (value: string) => {
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
            ? 'We\'ll send you a verification code via SMS' 
            : `Enter the 6-digit code sent to +91${phoneNumber}`
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
              <div className="flex">
                <div className="flex items-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-muted-foreground">
                  +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="rounded-l-none"
                  maxLength={10}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSendOTP} 
              disabled={!validatePhoneNumber(phoneNumber) || isLoading}
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
            <div className="space-y-4">
              <label htmlFor="otp" className="text-sm font-medium block text-center">
                Verification Code
              </label>
              
              <div className="flex justify-center">
                <InputOTP 
                  value={otp} 
                  onChange={handleOtpChange} 
                  maxLength={6}
                  className="gap-2"
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot 
                        key={index}
                        index={index} 
                        className="w-10 h-12 text-lg font-bold rounded-md border-2 border-input bg-background transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" 
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
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
            
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={handleBackToPhone}
                className="w-full"
                disabled={isLoading}
              >
                Change Phone Number
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleSendOTP}
                className="w-full text-sm"
                disabled={isLoading}
              >
                Resend OTP
              </Button>
            </div>
          </>
        )}
        
        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};