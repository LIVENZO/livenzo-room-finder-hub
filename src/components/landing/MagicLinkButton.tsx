import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, ArrowRight } from 'lucide-react';

interface MagicLinkButtonProps {
  onMagicLinkLogin: (email: string) => void;
  isLoading: boolean;
}

const MagicLinkButton: React.FC<MagicLinkButtonProps> = ({ onMagicLinkLogin, isLoading }) => {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');

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
      onClick={() => setShowEmailInput(true)} 
      className="w-full flex items-center justify-center gap-2"
      disabled={isLoading}
      variant="outline"
    >
      <Mail className="h-4 w-4" />
      Continue with Email (No Password)
    </Button>
  );
};

export default MagicLinkButton;