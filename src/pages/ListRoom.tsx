
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
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [bucketReady, setBucketReady] = useState<boolean>(false);
  
  useEffect(() => {
    // Redirect if not logged in or not a property owner
    if (!user) {
      navigate('/');
      return;
    }
    
    if (userRole !== 'owner') {
      toast.error('Only property owners can list rooms');
      navigate('/dashboard');
    }
    
    // Check if Supabase storage is initialized properly
    const checkStorage = async () => {
      try {
        // Check if storage is available
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        
        if (bucketError) {
          console.error("Error accessing storage:", bucketError);
          // Check if it's a permissions issue
          if (bucketError.message.includes('permission') || bucketError.message.includes('policy')) {
            setError("Storage permission issue. Please ensure you have the correct permissions.");
            toast.error("Storage permission denied. Please log out and log back in.");
          } else {
            setError("Storage configuration issue. Please try again later.");
          }
          return;
        }
        
        console.log("Available storage buckets:", buckets);
        
        const roomsBucketExists = buckets?.some(bucket => bucket.name === 'rooms');
        
        if (!roomsBucketExists) {
          console.log("The 'rooms' storage bucket is not configured in Supabase. Creating it now.");
          
          // Create rooms bucket if it doesn't exist
          const { data, error: createError } = await supabase.storage.createBucket('rooms', {
            public: true,
            fileSizeLimit: 10485760 // 10MB limit
          });
          
          if (createError) {
            console.error("Error creating 'rooms' bucket:", createError);
            
            if (createError.message.includes('row-level security') || createError.message.includes('permission')) {
              setError("Storage permission denied. Please ensure you're logged in with the right account.");
              toast.error("Storage permission denied. Please try logging out and back in.");
            } else {
              setError("Storage configuration issue. Please try again later.");
            }
          } else {
            console.log("Created 'rooms' bucket successfully");
            
            // Ensure the bucket is public
            await supabase.storage.updateBucket('rooms', { public: true });
            
            setBucketReady(true);
          }
        } else {
          console.log("'rooms' bucket exists");
          setBucketReady(true);
        }
      } catch (err) {
        console.error("Error checking Supabase storage:", err);
        setError("Error connecting to storage service. Please try again later.");
      }
    };
    
    checkStorage();
  }, [user, userRole, navigate]);
  
  // If not logged in or loading, return null
  if (!user || userRole !== 'owner') return null;
  
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
          
          <RoomListingForm userId={user.id} userRole={userRole} />
        </Card>
      </div>
    </Layout>
  );
};

export default ListRoom;
