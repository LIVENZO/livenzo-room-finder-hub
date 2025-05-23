
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { Booking, fetchOwnerBookings, fetchUserBookings, updateBookingStatus } from '@/services/BookingService';
import { format } from 'date-fns';
import { Loader2, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRooms } from '@/context/RoomContext';
import CallButton from '@/components/ui/CallButton';

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
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getRoomDetails = (roomId: string) => {
    return rooms.find(room => room.id === roomId);
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
                {userBookings.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xl text-gray-500 mb-4">You haven't made any booking requests yet</p>
                    <Button onClick={() => navigate('/find-room')}>Find Rooms</Button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {userBookings.map((booking) => {
                      const room = getRoomDetails(booking.room_id);
                      
                      return (
                        <Card key={booking.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>{room?.title || 'Room'}</CardTitle>
                                <CardDescription>{room?.location || 'Location unavailable'}</CardDescription>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Requested Move-in Date:</span>
                                <span className="font-medium">
                                  {booking.move_in_date ? format(new Date(booking.move_in_date), 'PPP') : 'Not specified'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Requested on:</span>
                                <span className="font-medium">{format(new Date(booking.created_at), 'PPP')}</span>
                              </div>
                              
                              {booking.message && (
                                <div className="mt-4 text-sm">
                                  <p className="text-gray-500 mb-1">Your message:</p>
                                  <p className="p-3 bg-gray-50 rounded-md">{booking.message}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/room/${booking.room_id}`)}
                            >
                              View Room
                            </Button>
                            
                            {booking.status === 'pending' && (
                              <Button
                                variant="destructive"
                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                              >
                                Cancel Request
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="received-requests">
                {ownerBookings.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xl text-gray-500 mb-4">You haven't received any booking requests yet</p>
                    <Button onClick={() => navigate('/list-room')}>List Your Room</Button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {ownerBookings.map((booking) => {
                      const room = getRoomDetails(booking.room_id);
                      
                      return (
                        <Card key={booking.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>{room?.title || 'Room'}</CardTitle>
                                <CardDescription>{room?.location || 'Location unavailable'}</CardDescription>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Renter Information Section */}
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  Renter Information
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-blue-700">Name:</span>
                                    <span className="font-medium text-blue-900">
                                      {booking.renter_name || 'Name not available'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-blue-700">Phone:</span>
                                    <span className="font-medium text-blue-900">
                                      {booking.renter_phone || 'Phone not available'}
                                    </span>
                                  </div>
                                  {booking.renter_phone && (
                                    <div className="pt-2">
                                      <CallButton
                                        phoneNumber={booking.renter_phone}
                                        label="Call Renter"
                                        variant="default"
                                        size="sm"
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Booking Details */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Requested Move-in Date:</span>
                                  <span className="font-medium">
                                    {booking.move_in_date ? format(new Date(booking.move_in_date), 'PPP') : 'Not specified'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Requested on:</span>
                                  <span className="font-medium">{format(new Date(booking.created_at), 'PPP')}</span>
                                </div>
                                
                                {booking.message && (
                                  <div className="mt-4 text-sm">
                                    <p className="text-gray-500 mb-1">Message from renter:</p>
                                    <p className="p-3 bg-gray-50 rounded-md">{booking.message}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className={`flex ${booking.status === 'pending' ? 'justify-between' : 'justify-end'}`}>
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleUpdateStatus(booking.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                                <Button
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleUpdateStatus(booking.id, 'approved')}
                                >
                                  Approve
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/room/${booking.room_id}`)}
                            >
                              View Room
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Bookings;
