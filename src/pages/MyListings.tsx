
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useRooms, Room } from '@/context/RoomContext';
import RoomManagementCard from '@/components/RoomManagementCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';

const MyListings: React.FC = () => {
  const { user } = useAuth();
  const { getUserRooms, isLoading } = useRooms();
  const navigate = useNavigate();
  const [updatingRoom, setUpdatingRoom] = useState<string | null>(null);

  const userRooms = getUserRooms();

  // If user is not logged in, redirect to login page
  React.useEffect(() => {
    if (!user && !localStorage.getItem('guest_mode')) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <Button onClick={() => navigate('/list-room')} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Listing
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : userRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRooms.map(room => (
              <RoomManagementCard 
                key={room.id} 
                room={room}
                isUpdating={updatingRoom === room.id}
                setUpdatingRoom={setUpdatingRoom}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600 mb-4">You haven't listed any rooms yet.</p>
            <Button onClick={() => navigate('/list-room')}>List Your First Room</Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyListings;
