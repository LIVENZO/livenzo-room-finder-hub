import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import RoomListingForm from '@/components/room/RoomListingForm';
import { supabase } from '@/integrations/supabase/client';
import { testStorageAccess } from '@/services/imageUploadService';

const ListRoom: React.FC = () => {
  const { user, userRole, session } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState<boolean>(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState<boolean>(true);
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast.error('Please log in to list rooms', {
        description: 'You need to be logged in as a property owner'
      });
      navigate('/');
      return;
    }
    
    if (userRole !== 'owner') {
      toast.error('Only property owners can list rooms', {
        description: 'Please switch to a property owner account'
      });
      navigate('/dashboard');
      return;
    }
    
    // Check if Supabase storage is accessible
    const checkStorageAccess = async () => {
      try {
        setIsCheckingStorage(true);
        console.log("Checking storage access with session:", session ? "exists" : "none");
        
        if (!session) {
          setError("No active session found. Please log in again.");
          setStorageReady(false);
          return;
        }
        
        // First try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error("Session refresh error:", refreshError);
          setError("Your session has expired. Please log out and log in again.");
          setStorageReady(false);
          return;
        }
        
        // Test storage access with the refreshed session
        console.log("Testing storage access with refreshed session");
        const hasAccess = await testStorageAccess('rooms');
        
        if (!hasAccess) {
          setError("Storage access denied. Please log out and log in again to refresh your permissions.");
          setStorageReady(false);
          return;
        }
        
        console.log("Storage access test successful");
        setStorageReady(true);
        setError(null);
      } catch (err) {
        console.error("Error checking Supabase storage:", err);
        setError("Error connecting to storage service. Please try again later.");
        setStorageReady(false);
      } finally {
        setIsCheckingStorage(false);
      }
    };
    
    if (session) {
      checkStorageAccess();
    } else {
      console.warn("No active session for storage permission check");
      setError("Please log in again to ensure you have proper permissions.");
      setIsCheckingStorage(false);
      setStorageReady(false);
    }
  }, [user, userRole, navigate, session]);
  
  // If not logged in, return null
  if (!user) return null;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">List Your Room</h1>
        
        {userRole !== 'owner' && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only property owners can list rooms. Please sign out and sign in again as a property owner.
            </AlertDescription>
          </Alert>
        )}
        
        {!session && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to be logged in to upload images. Please log in before proceeding.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!error && session && storageReady && (
          <Alert variant="default" className="mb-6 border-green-400 bg-green-50 dark:bg-green-900/20">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription>
              All systems ready! You can now list your room with images.
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Room Details</CardTitle>
            <CardDescription>
              Provide details about your room to attract potential renters. Add photos to increase visibility.
            </CardDescription>
          </CardHeader>
          
          <RoomListingForm 
            userId={user?.id || 'guest'} 
            userRole={userRole || 'guest'} 
            storageReady={storageReady}
            isCheckingStorage={isCheckingStorage}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default ListRoom;
