import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRooms } from '@/context/RoomContext';
import Layout from '@/components/Layout';
import RoomCard from '@/components/RoomCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isLoading, isGuestMode, userRole } = useAuth();
  const navigate = useNavigate();
  const { rooms, getUserRooms } = useRooms();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    // Add a slight delay to handle potential race conditions with auth state
    const redirectTimer = setTimeout(() => {
      if (!isLoading && !user && !isGuestMode) {
        console.log("No user found after loading and not in guest mode, redirecting to login");
        setIsRedirecting(true);
        navigate('/');
      }
    }, 1000);
    
    return () => clearTimeout(redirectTimer);
  }, [user, isLoading, isGuestMode, navigate]);
  
  if (isLoading || isRedirecting) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-500">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Get the user name for personalized greeting or use guest greeting
  let greeting = "Welcome, Guest!";
  if (user) {
    // Get the user name from user_metadata or fallback to email
    const userName = user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    user.email?.split('@')[0] || 
                    'User';
    greeting = `Welcome, ${userName}!`;
  }
  
  // Get featured rooms based on user role
  const featuredRooms = userRole === 'owner' ? getUserRooms().slice(0, 3) : rooms.slice(0, 3);
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{greeting}</h1>
              <p className="text-white/90 mb-4">
                {userRole === 'owner' 
                  ? 'Manage your properties and list new rooms.' 
                  : 'Find your perfect room or list a new one.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {userRole === 'owner' ? (
                  <>
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      onClick={() => navigate('/list-room')}
                      className="bg-white text-primary hover:bg-gray-100"
                    >
                      List Your Room
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => navigate('/my-listings')}
                      className="border-white text-white hover:bg-white/20"
                    >
                      View Your Listings
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      onClick={() => navigate('/find-room')}
                      className="bg-white text-primary hover:bg-gray-100"
                    >
                      Find a Room
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => navigate('/list-room')}
                      className="border-white text-white hover:bg-white/20"
                    >
                      List Your Room
                    </Button>
                  </>
                )}
              </div>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=300&auto=format" 
              alt="Room illustration" 
              className="hidden md:block w-64 h-auto rounded-lg shadow-lg" 
            />
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {userRole === 'owner' ? 'Your Listed Rooms' : 'Featured Rooms'}
            </h2>
            <Button 
              variant="ghost" 
              onClick={() => navigate(userRole === 'owner' ? '/my-listings' : '/find-room')}
              className="text-primary"
            >
              View all
            </Button>
          </div>
          {featuredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <p className="text-gray-600 mb-4">
                {userRole === 'owner' 
                  ? "You haven't listed any rooms yet" 
                  : "No featured rooms available at the moment"}
              </p>
              <Button onClick={() => navigate('/list-room')}>
                {userRole === 'owner' ? 'List Your First Room' : 'Be the First to List a Room'}
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRole === 'owner' ? (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-2">Add Clear Photos</h3>
                  <p className="text-sm text-gray-500">
                    Upload high-quality photos to showcase your property and attract more potential tenants.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-2">Detailed Description</h3>
                  <p className="text-sm text-gray-500">
                    Provide comprehensive details about your property, including amenities and nearby facilities.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-2">Manage Listings</h3>
                  <p className="text-sm text-gray-500">
                    Keep your listings updated and mark them as unavailable when rented out.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-2">Looking for a room?</h3>
                  <p className="text-sm text-gray-500">
                    Use filters to narrow down your search and find the perfect match for your needs.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-2">Have a room to rent?</h3>
                  <p className="text-sm text-gray-500">
                    Add clear photos and detailed descriptions to attract more potential tenants.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium mb-2">Safety First</h3>
                  <p className="text-sm text-gray-500">
                    Always verify details and communicate clearly before finalizing any arrangements.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
