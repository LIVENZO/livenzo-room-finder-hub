import React from 'react';
import { FirebaseAuthFlow } from '@/components/auth/FirebaseAuthFlow';
import { NotificationTester } from '@/components/test/NotificationTester';
import { useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const FirebaseTest: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, signOut } = useFirebaseAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold">Firebase Authentication Test</h1>
        </div>

        {!isLoggedIn ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Login with Firebase OTP</h2>
              <p className="text-muted-foreground">
                This demonstrates the Firebase phone authentication flow for Android
              </p>
            </div>
            <FirebaseAuthFlow onAuthSuccess={() => navigate('/dashboard')} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Authentication Successful!</h2>
              <p className="text-muted-foreground mb-4">
                You are now logged in with Firebase authentication
              </p>
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Test Push Notifications</h3>
              <NotificationTester />
            </div>
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">How it works:</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>User enters phone number and requests OTP</li>
            <li>Firebase sends OTP to the phone number</li>
            <li>User enters OTP to verify</li>
            <li>App captures Firebase UID, phone number, and FCM token</li>
            <li>Data is synced to Supabase user_profiles table via edge function</li>
            <li>User can receive push notifications using the saved FCM token</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTest;