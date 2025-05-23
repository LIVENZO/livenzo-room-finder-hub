
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/services/BookingService';
import { Room } from '@/types/room';

interface UserBookingCardProps {
  booking: Booking;
  room: Room | undefined;
  onViewRoom: (roomId: string) => void;
  onCancelRequest: (bookingId: string) => void;
}

const UserBookingCard: React.FC<UserBookingCardProps> = ({
  booking,
  room,
  onViewRoom,
  onCancelRequest
}) => {
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

  return (
    <Card>
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
          onClick={() => onViewRoom(booking.room_id)}
        >
          View Room
        </Button>
        
        {booking.status === 'pending' && (
          <Button
            variant="destructive"
            onClick={() => onCancelRequest(booking.id)}
          >
            Cancel Request
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default UserBookingCard;
