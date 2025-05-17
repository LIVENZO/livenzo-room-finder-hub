
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
        
        // Check if storage is available by listing buckets
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        
        if (bucketError) {
          console.error("Error accessing storage:", bucketError);
          
          if (bucketError.message.includes('permission') || bucketError.message.includes('policy')) {
            setError("Storage permission issue. Please ensure you're logged in with the correct permissions.");
            return;
          } else {
            setError("Storage service unavailable. Please try again later.");
            return;
          }
        }
        
        console.log("Successfully accessed storage buckets:", buckets?.length);
        
        // Check if the rooms bucket exists
        const roomsBucket = buckets?.find(b => b.name === 'rooms');
        
        if (!roomsBucket) {
          console.log("The 'rooms' bucket is not found. It will be created when uploading.");
          
          // Attempt to create the bucket now
          const { error: createError } = await supabase.storage.createBucket('rooms', { 
            public: true,
            fileSizeLimit: 10485760 // 10MB
          });
          
          if (createError) {
            console.error("Error creating rooms bucket:", createError);
            if (createError.message.includes('permission') || createError.message.includes('policy')) {
              setError("Unable to create storage bucket. Please ensure you're logged in.");
              return;
            }
          } else {
            console.log("Successfully created 'rooms' bucket");
          }
        } else {
          console.log("'rooms' bucket exists and is accessible");
        }
        
        // Verify we can access the bucket with a test operation
        if (session?.user?.id) {
          const testPath = `${session.user.id}/test-permissions.txt`;
          
          const { error: uploadError } = await supabase.storage
            .from('rooms')
            .upload(testPath, new Blob(['test']), {
              upsert: true
            });
            
          if (uploadError) {
            console.error("Error testing storage permissions:", uploadError);
            
            if (uploadError.message.includes('row-level security') || 
                uploadError.message.includes('permission denied')) {
              setError("Storage permission denied. Please log out and log back in to refresh your session.");
            } else {
              setError("Unable to access storage. Please try again later.");
            }
            return;
          }
          
          // Clean up the test file
          await supabase.storage.from('rooms').remove([testPath]);
          console.log("Storage permission test successful");
        } else {
          console.warn("No user ID available for storage permission test");
        }
        
        setStorageReady(true);
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
          <Alert variant="warning" className="mb-6">
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
