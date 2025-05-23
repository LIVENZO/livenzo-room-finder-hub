
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Booking, fetchOwnerBookings, fetchUserBookings, updateBookingStatus } from '@/services/BookingService';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRooms } from '@/context/RoomContext';
import BookingList from '@/components/bookings/BookingList';

const Bookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rooms } = useRooms();
  
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-requests');
  
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    const loadBookings = async () => {
      setLoading(true);
      
      // Load bookings made by the user
      const myBookings = await fetchUserBookings(user.id);
      setUserBookings(myBookings);
      
      // Load bookings received as an owner
      const receivedBookings = await fetchOwnerBookings(user.id);
      setOwnerBookings(receivedBookings);
      
      setLoading(false);
    };
    
    loadBookings();
  }, [user, navigate]);
  
  const handleUpdateStatus = async (bookingId: string, status: 'approved' | 'rejected' | 'cancelled') => {
    const result = await updateBookingStatus(bookingId, status);
    
    if (result) {
      // Update local state to reflect the change
      if (status === 'cancelled') {
        setUserBookings(userBookings.map(booking => 
          booking.id === bookingId ? { ...booking, status } : booking
        ));
      } else {
        setOwnerBookings(ownerBookings.map(booking => 
          booking.id === bookingId ? { ...booking, status } : booking
        ));
      }
    }
  };
  
  const getRoomDetails = (roomId: string) => {
    return rooms.find(room => room.id === roomId);
  };
  
  const handleViewRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };
  
  const handleCancelRequest = (bookingId: string) => {
    handleUpdateStatus(bookingId, 'cancelled');
  };
  
  const handleReject = (bookingId: string) => {
    handleUpdateStatus(bookingId, 'rejected');
  };
  
  const handleApprove = (bookingId: string) => {
    handleUpdateStatus(bookingId, 'approved');
  };
  
  return (
    <Layout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Room Bookings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="my-requests">My Booking Requests</TabsTrigger>
            <TabsTrigger value="received-requests">
              Received Requests
              {ownerBookings.filter(b => b.status === 'pending').length > 0 && (
                <Badge className="ml-2 bg-primary">{ownerBookings.filter(b => b.status === 'pending').length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="my-requests">
                <BookingList
                  bookings={userBookings}
                  type="user"
                  getRoomDetails={getRoomDetails}
                  onViewRoom={handleViewRoom}
                  onCancelRequest={handleCancelRequest}
                  onNavigate={navigate}
                />
              </TabsContent>
              
              <TabsContent value="received-requests">
                <BookingList
                  bookings={ownerBookings}
                  type="owner"
                  getRoomDetails={getRoomDetails}
                  onViewRoom={handleViewRoom}
                  onReject={handleReject}
                  onApprove={handleApprove}
                  onNavigate={navigate}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Bookings;
