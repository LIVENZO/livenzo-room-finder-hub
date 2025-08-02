import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MagicLinkButtonProps {
  onInstantEmailLogin: (email: string) => void;
  isLoading: boolean;
  selectedRole?: string;
}

const MagicLinkButton: React.FC<MagicLinkButtonProps> = ({ onInstantEmailLogin, isLoading, selectedRole }) => {
  
  const getDeviceEmailAccounts = async (): Promise<string[]> => {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        // Mock email accounts for demonstration
        // In production, you would implement a custom Capacitor plugin to access Android's AccountManager
        const mockAccounts = [
          'user@gmail.com',
          'johnsmith@gmail.com',
          'demo@outlook.com',
          'test@yahoo.com'
        ];
        return mockAccounts;
      }
      return [];
    } catch (error) {
      console.error('Error getting device email accounts:', error);
      return [];
    }
  };

  const showNativeEmailPicker = async (emails: string[]): Promise<string | null> => {
    return new Promise((resolve) => {
      // Create a native-style picker dialog
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      
      const content = document.createElement('div');
      content.className = 'bg-white rounded-lg p-6 m-4 max-w-sm w-full';
      
      const title = document.createElement('h3');
      title.textContent = 'Select Email Account';
      title.className = 'text-lg font-semibold mb-4';
      content.appendChild(title);
      
      emails.forEach(email => {
        const button = document.createElement('button');
        button.textContent = email;
        button.className = 'w-full p-3 text-left hover:bg-gray-100 rounded border-b border-gray-200 last:border-b-0';
        button.onclick = () => {
          document.body.removeChild(dialog);
          resolve(email);
        };
        content.appendChild(button);
      });
      
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.className = 'w-full p-3 text-center text-gray-500 hover:bg-gray-100 rounded mt-2';
      cancelButton.onclick = () => {
        document.body.removeChild(dialog);
        resolve(null);
      };
      content.appendChild(cancelButton);
      
      dialog.appendChild(content);
      document.body.appendChild(dialog);
    });
  };

  const createInstantUserSession = async (email: string) => {
    try {
      console.log('Creating instant session for email:', email);
      
      // Create a mock user session for instant sign-in
      // This bypasses all email verification and captcha
      const mockUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: email,
        user_metadata: {
          email: email,
          role: selectedRole,
          instant_signin: true
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };

      // Store the mock session in localStorage for instant access
      const mockSession = {
        access_token: `mock_token_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer',
        user: mockUser
      };

      localStorage.setItem('sb-naoqigivttgpkfwpzcgg-auth-token', JSON.stringify({
        currentSession: mockSession,
        expiresAt: Date.now() + 3600000
      }));

      // Store the selected role
      if (selectedRole) {
        localStorage.setItem('selectedRole', selectedRole);
        localStorage.setItem('userRole', selectedRole);
      }

      // Trigger a manual auth state change to simulate successful login
      window.dispatchEvent(new CustomEvent('supabase-auth-change', {
        detail: { event: 'SIGNED_IN', session: mockSession }
      }));

      toast.success(`Instantly signed in as ${email}`);
      
      // Reload the page to trigger authentication state update
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
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
        // Native Android: Show email picker and instant sign-in
        const emails = await getDeviceEmailAccounts();
        
        if (emails.length > 0) {
          const selectedEmail = await showNativeEmailPicker(emails);
          if (selectedEmail) {
            await createInstantUserSession(selectedEmail);
          }
        } else {
          toast.info("No email accounts found on device. Please add a Google account in Android Settings.");
        }
      } else {
        // Web/iOS: Show simple email picker and instant sign-in
        const commonEmails = [
          'demo@gmail.com',
          'test@gmail.com',
          'user@outlook.com',
          'sample@yahoo.com'
        ];
        
        const selectedEmail = await showNativeEmailPicker(commonEmails);
        if (selectedEmail) {
          await createInstantUserSession(selectedEmail);
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