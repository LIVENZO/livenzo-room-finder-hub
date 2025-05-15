
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import RoomListingForm from '@/components/room/RoomListingForm';

const ListRoom: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  
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
