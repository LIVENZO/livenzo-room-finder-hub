import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { toast } from 'sonner';

interface MagicLinkButtonProps {
  onMagicLinkLogin: (email: string) => void;
  isLoading: boolean;
  selectedRole?: string;
}

const MagicLinkButton: React.FC<MagicLinkButtonProps> = ({ onMagicLinkLogin, isLoading, selectedRole }) => {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');

  const getAndroidEmailAccounts = async (): Promise<string[]> => {
    try {
      // For Android, we'll use a workaround since there's no direct email picker plugin
      // We'll use the native Android email chooser intent
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        // This would require a custom plugin in a real implementation
        // For now, we'll simulate with common email domains
        const deviceInfo = await Device.getInfo();
        console.log('Device info:', deviceInfo);
        
        // In a real implementation, you would use a custom Capacitor plugin
        // to access Android's AccountManager and get Google accounts
        // For demonstration, we'll show a simple picker
        return [];
      }
      return [];
    } catch (error) {
      console.error('Error getting Android email accounts:', error);
      return [];
    }
  };

  const handleEmailPicker = async () => {
    if (selectedRole !== 'renter') {
      // For non-renter roles, show the regular email input
      setShowEmailInput(true);
      return;
    }

    const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    
    if (isAndroid) {
      try {
        // For Android renter role, try to get email accounts
        const accounts = await getAndroidEmailAccounts();
        
        if (accounts.length > 0) {
          // In a real implementation, show a native picker dialog
          // For now, we'll use the first account or show input
          const selectedEmail = accounts[0];
          onMagicLinkLogin(selectedEmail);
        } else {
          // Fallback to input method if no accounts found
          toast.info("No saved email accounts found. Please enter your email.");
          setShowEmailInput(true);
        }
      } catch (error) {
        console.error('Error with Android email picker:', error);
        setShowEmailInput(true);
      }
    } else {
      // For web or iOS, use the regular email input
      setShowEmailInput(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onMagicLinkLogin(email.trim());
    }
  };

  if (showEmailInput) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="w-full"
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Send Magic Link
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEmailInput(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Button 
      onClick={handleEmailPicker} 
      className="w-full flex items-center justify-center gap-2"
      disabled={isLoading}
      variant="outline"
    >
      <Mail className="h-4 w-4" />
      {selectedRole === 'renter' && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' 
        ? "Select Email Account" 
        : "Continue with Email (No Password)"}
    </Button>
  );
};

export default MagicLinkButton;