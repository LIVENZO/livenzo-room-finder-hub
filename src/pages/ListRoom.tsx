
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import RoomListingForm from '@/components/room/RoomListingForm';
import { supabase } from '@/integrations/supabase/client';
import { testStorageAccess } from '@/services/imageUploadService';

const ListRoom: React.FC = () => {
  const { user, userRole, session } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState<boolean>(false);
  
  useEffect(() => {
    // Redirect if not logged in or not a property owner
    if (!user && !localStorage.getItem('guest_mode')) {
      toast.error('Please log in to list rooms');
      navigate('/');
      return;
    }
    
    if (userRole !== 'owner') {
      toast.error('Only property owners can list rooms');
      navigate('/dashboard');
      return;
    }
    
    // Check if Supabase storage is accessible
    const checkStorageAccess = async () => {
      try {
        console.log("Checking storage access with session:", session ? "exists" : "none");
        
        if (!session) {
          setError("No active session. Please log in to upload images.");
          return;
        }
        
        // Test storage access
        const hasAccess = await testStorageAccess('rooms');
        
        if (!hasAccess) {
          setError("Storage access denied. Please check if you are logged in.");
          return;
        }
        
        setStorageReady(true);
        setError(null);
      } catch (err) {
        console.error("Error checking Supabase storage:", err);
        setError("Error connecting to storage service. Please try again later.");
      }
    };
    
    if (session) {
      checkStorageAccess();
    } else {
      console.warn("No active session for storage permission check");
      setError("Please ensure you are logged in to upload images.");
    }
  }, [user, userRole, navigate, session]);
  
  // If not logged in or loading, return null
  if (!user && !localStorage.getItem('guest_mode')) return null;
  
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
          <Alert variant="default" className="mb-6 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
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
        
        <Card>
          <CardHeader>
            <CardTitle>Room Details</CardTitle>
            <CardDescription>
              Provide detailed information about the room you want to list.
            </CardDescription>
          </CardHeader>
          
          <RoomListingForm userId={user?.id || 'guest'} userRole={userRole || 'guest'} />
        </Card>
      </div>
    </Layout>
  );
};

export default ListRoom;
