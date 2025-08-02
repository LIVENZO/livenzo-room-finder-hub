
import React, { useState } from 'react';
import RoleSelector from './RoleSelector';
import SocialLoginButtons from './SocialLoginButtons';
import MagicLinkButton from './MagicLinkButton';

interface LandingCardProps {
  userRole: string;
  setUserRole: (role: string) => void;
  canChangeRole: boolean;
  isLoading: boolean;
  handleGoogleLogin: () => void;
  handleFacebookLogin: () => void;
  handleMagicLinkLogin: (email: string) => void;
}

const LandingCard: React.FC<LandingCardProps> = ({
  userRole,
  setUserRole,
  canChangeRole,
  isLoading,
  handleGoogleLogin,
  handleFacebookLogin,
  handleMagicLinkLogin
}) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Welcome to Livenzo</h2>
        <p className="text-gray-500">
          Connect with room owners or find tenants for your property.
        </p>
      </div>
      
      <RoleSelector 
        userRole={userRole} 
        setUserRole={setUserRole} 
        canChangeRole={canChangeRole} 
      />
      
      <MagicLinkButton 
        onMagicLinkLogin={handleMagicLinkLogin}
        isLoading={isLoading}
        selectedRole={userRole}
      />
      
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
      
      <SocialLoginButtons 
        onGoogleLogin={handleGoogleLogin} 
        onFacebookLogin={handleFacebookLogin}
        isLoading={isLoading} 
      />
      
      <div className="text-sm text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  );
};

export default LandingCard;
