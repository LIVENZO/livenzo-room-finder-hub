
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import RoomManagementCard from '@/components/RoomManagementCard';
import { useRooms } from '@/context/RoomContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { getUserRooms } = useRooms();
  const userRooms = getUserRooms();
  const [updatingRoom, setUpdatingRoom] = React.useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // If not logged in, return null
  if (!user) return null;
  
  const isOwner = userRole === 'owner';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {isOwner ? 'Your Listed Rooms' : 'Dashboard'}
          </h1>
          
          {isOwner && (
            <Button onClick={() => navigate('/list-room')}>
              <Plus className="mr-2 h-4 w-4" />
              List a Room
            </Button>
          )}
        </div>
        
        {isOwner && userRooms.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium mb-2">No rooms listed yet</h3>
            <p className="text-gray-500 mb-4">
              Get started by listing your first room.
            </p>
            <Button onClick={() => navigate('/list-room')}>List Your First Room</Button>
          </div>
        ) : isOwner ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRooms.map((room) => (
              <RoomManagementCard 
                key={room.id} 
                room={room} 
                isUpdating={updatingRoom === room.id}
                setUpdatingRoom={setUpdatingRoom}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium mb-2">You're signed in as a renter</h3>
            <p className="text-gray-500 mb-4">
              Browse available rooms to find your perfect match.
            </p>
            <Button onClick={() => navigate('/find-room')}>Find a Room</Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
