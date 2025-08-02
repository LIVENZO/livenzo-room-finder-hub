import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MagicLinkButtonProps {
  onMagicLinkLogin: (email: string) => void;
  isLoading: boolean;
  selectedRole?: string;
}

const MagicLinkButton: React.FC<MagicLinkButtonProps> = ({ onMagicLinkLogin, isLoading, selectedRole }) => {
  
  const getDeviceEmailAccounts = async (): Promise<string[]> => {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        // For demonstration, return mock email accounts
        // In production, you'd use a custom Capacitor plugin to access AccountManager
        const mockAccounts = [
          'user@gmail.com',
          'test@gmail.com',
          'demo@outlook.com'
        ];
        return mockAccounts;
      }
      return [];
    } catch (error) {
      console.error('Error getting device email accounts:', error);
      return [];
    }
  };

  const showEmailPicker = async (emails: string[]) => {
    return new Promise<string | null>((resolve) => {
      // Create a simple picker dialog
      const selectedEmail = emails[0]; // For demo, auto-select first email
      
      // In production, you'd show a native dialog with all emails
      toast.success(`Selected: ${selectedEmail}`);
      resolve(selectedEmail);
    });
  };

  const createInstantSession = async (email: string) => {
    try {
      // Create user session directly using Supabase admin functions
      // For now, we'll use signInWithOtp with immediate redirect
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: selectedRole,
            email: email,
            instant_signin: true
          }
        }
      });

      if (error) {
        console.error('Sign-in error:', error);
        toast.error('Failed to sign in. Please try again.');
        return;
      }

      toast.success('Check your email and click the link to complete sign-in!');
    } catch (error) {
      console.error('Instant sign-in error:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  const handleEmailSignIn = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      const isAndroid = Capacitor.getPlatform() === 'android';
      
      if (isNative && isAndroid) {
        // Native Android: Use email picker
        const emails = await getDeviceEmailAccounts();
        
        if (emails.length > 0) {
          const selectedEmail = await showEmailPicker(emails);
          if (selectedEmail) {
            await createInstantSession(selectedEmail);
          }
        } else {
          toast.info("No email accounts found on device. Please add a Google account in Settings.");
        }
      } else {
        // Web/iOS: Prompt for email
        const email = prompt("Enter your email address:");
        if (email && email.includes('@')) {
          await createInstantSession(email);
        } else if (email) {
          toast.error('Please enter a valid email address.');
        }
      }
    } catch (error) {
      console.error('Email sign-in error:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  const buttonText = () => {
    const isNative = Capacitor.isNativePlatform();
    const isAndroid = Capacitor.getPlatform() === 'android';
    
    if (isNative && isAndroid) {
      return "Select Email Account";
    }
    return "Continue with Email";
  };

  return (
    <Button 
      onClick={handleEmailSignIn} 
      className="w-full flex items-center justify-center gap-2"
      disabled={isLoading}
      variant="outline"
    >
      <Mail className="h-4 w-4" />
      {buttonText()}
    </Button>
  );
};

export default MagicLinkButton;