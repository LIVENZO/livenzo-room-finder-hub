import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MagicLinkButtonProps {
  onMagicLinkSent: (email: string) => void;
  isLoading: boolean;
  selectedRole?: string;
}

const MagicLinkButton: React.FC<MagicLinkButtonProps> = ({ onMagicLinkSent, isLoading, selectedRole }) => {
  const [email, setEmail] = useState('');
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLocalLoading(true);
    
    try {
      console.log('Sending magic link to:', email);
      
      // Store the selected role for after authentication
      if (selectedRole) {
        localStorage.setItem('selectedRole', selectedRole);
      }
      
      // Send magic link using Supabase OTP
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: selectedRole
          }
        }
      });

      if (error) {
        console.error('Supabase OTP error:', error);
        toast.error(`Failed to send magic link: ${error.message}`);
      } else {
        console.log('Magic link sent successfully:', data);
        toast.success('Magic link sent! Please check your email and click the link to sign in.');
        onMagicLinkSent(email);
      }
      
    } catch (error) {
      console.error('Email sign-in error:', error);
      toast.error('Failed to send magic link. Please try again.');
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEmailSignIn();
    }
  };

  const isButtonLoading = isLoading || isLocalLoading;

  return (
    <div className="space-y-3">
      <Input
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isButtonLoading}
        className="w-full"
      />
      <Button 
        onClick={handleEmailSignIn} 
        className="w-full flex items-center justify-center gap-2"
        disabled={isButtonLoading || !email.trim()}
        variant="outline"
      >
        {isButtonLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Continue with Email
      </Button>
    </div>
  );
};

export default MagicLinkButton;