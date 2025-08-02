import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface EmailPasswordFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  isLoading: boolean;
}

const EmailPasswordForm: React.FC<EmailPasswordFormProps> = ({ 
  onSignIn, 
  onSignUp, 
  onResetPassword, 
  isLoading 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      if (isSignUp) {
        await onSignUp(email, password);
      } else {
        await onSignIn(email, password);
      }
    } catch (error) {
      // Error handling is done in the auth methods
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address first');
      return;
    }

    try {
      await onResetPassword(email);
    } catch (error) {
      // Error handling is done in the auth method
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="pl-10"
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        <Button 
          type="submit"
          className="w-full"
          disabled={isLoading || !email.trim() || !password.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
      </form>

      <div className="flex flex-col space-y-2">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-primary hover:underline"
          disabled={isLoading}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
        
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
          disabled={isLoading || !email.trim()}
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
};

export default EmailPasswordForm;