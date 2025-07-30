
import React, { useState } from 'react';
import RoleSelector from './RoleSelector';
import SocialLoginButtons from './SocialLoginButtons';

interface LandingCardProps {
  userRole: string;
  setUserRole: (role: string) => void;
  canChangeRole: boolean;
  isLoading: boolean;
  handleGoogleLogin: () => void;
  handleFacebookLogin: () => void;
}

const LandingCard: React.FC<LandingCardProps> = ({
  userRole,
  setUserRole,
  canChangeRole,
  isLoading,
  handleGoogleLogin,
  handleFacebookLogin
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
