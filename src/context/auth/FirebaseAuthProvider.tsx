import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth } from '@/config/firebase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FirebaseAuthContextType {
  user: FirebaseUser | null;
  isLoading: boolean;
  userRole: string | null;
  isOwner: boolean;
  logout: () => Promise<void>;
  syncWithSupabase: (user: FirebaseUser) => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
  user: null,
  isLoading: true,
  userRole: null,
  isOwner: false,
  logout: async () => {},
  syncWithSupabase: async () => {},
});

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const isOwner = userRole === 'owner';

  // Function to get FCM token
  const getFCMToken = useCallback(async (): Promise<string | null> => {
    try {
      // Check if we're in Android WebView
      if ((window as any).Android && (window as any).Android.getFCMToken) {
        const token = (window as any).Android.getFCMToken();
        console.log('FCM token from Android:', token ? token.substring(0, 20) + '...' : null);
        return token;
      }
      
      // For web, we could implement web FCM here if needed
      console.log('FCM token not available in web environment');
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }, []);

  // Sync Firebase user data with Supabase
  const syncWithSupabase = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      console.log('Syncing Firebase user with Supabase:', firebaseUser.uid);
      
      const fcmToken = await getFCMToken();
      
      // Call the sync edge function
      const { data, error } = await supabase.functions.invoke('sync-firebase-user', {
        body: {
          firebase_uid: firebaseUser.uid,
          phone_number: firebaseUser.phoneNumber,
          fcm_token: fcmToken,
        },
      });

      if (error) {
        console.error('Error syncing with Supabase:', error);
        throw error;
      }

      console.log('Successfully synced with Supabase:', data);

      // Note: We'll handle RLS through application logic since we can't set context in edge functions

      // Get user role from user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
      } else if (profileData) {
        // Determine role based on profile data or default to renter
        const role = localStorage.getItem('selectedRole') || 'renter';
        setUserRole(role);
        localStorage.setItem('userRole', role);
      }

    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      toast.error('Failed to sync user data');
    }
  }, [getFCMToken]);

  // Handle Firebase auth state changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        const auth = await getFirebaseAuth();
        
        unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          console.log('Firebase auth state changed:', firebaseUser?.uid || 'signed out');
          
          if (firebaseUser) {
            setUser(firebaseUser);
            await syncWithSupabase(firebaseUser);
          } else {
            setUser(null);
            setUserRole(null);
            localStorage.removeItem('userRole');
            localStorage.removeItem('selectedRole');
          }
          
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error initializing Firebase auth:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [syncWithSupabase]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const auth = await getFirebaseAuth();
      await auth.signOut();
      
      // Clear local storage
      localStorage.removeItem('userRole');
      localStorage.removeItem('selectedRole');
      
      // Notify Android if available
      if ((window as any).Android && (window as any).Android.signOut) {
        (window as any).Android.signOut();
      }
      
      toast.info('You have been signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: FirebaseAuthContextType = {
    user,
    isLoading,
    userRole,
    isOwner,
    logout,
    syncWithSupabase,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};