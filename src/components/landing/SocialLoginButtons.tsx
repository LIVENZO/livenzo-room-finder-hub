import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
interface SocialLoginButtonsProps {
  onGoogleLogin: () => void;
  onFacebookLogin: () => void;
  isLoading: boolean;
}
const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGoogleLogin,
  onFacebookLogin,
  isLoading
}) => {
  return <div className="space-y-3">
      

      
    </div>;
};
export default SocialLoginButtons;