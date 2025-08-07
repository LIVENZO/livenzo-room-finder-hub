import React, { useState } from 'react';
import RoleSelector from './RoleSelector';
import SocialLoginButtons from './SocialLoginButtons';
import PhoneOTPForm from './PhoneOTPForm';
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
  return <div className="w-full bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg space-y-6 mx-auto max-w-sm">
      <div className="space-y-2 text-center">
        
        
      </div>
      
      <RoleSelector userRole={userRole} setUserRole={setUserRole} canChangeRole={canChangeRole} />
      
      <PhoneOTPForm onSendOTP={handleOTPAuth.sendOTP} onVerifyOTP={handleOTPAuth.verifyOTP} isLoading={isLoading} />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      
      <SocialLoginButtons onGoogleLogin={handleGoogleLogin} onFacebookLogin={handleFacebookLogin} isLoading={isLoading} />
      
      
    </div>;
};
export default LandingCard;