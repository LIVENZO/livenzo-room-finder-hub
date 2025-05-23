
import React from 'react';
import { format } from 'date-fns';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Booking } from '@/services/BookingService';
import { Room } from '@/types/room';
import CallButton from '@/components/ui/CallButton';

interface OwnerBookingCardProps {
  booking: Booking;
  room: Room | undefined;
  onViewRoom: (roomId: string) => void;
  onReject: (bookingId: string) => void;
  onApprove: (bookingId: string) => void;
}

const OwnerBookingCard: React.FC<OwnerBookingCardProps> = ({
  booking,
  room,
  onViewRoom,
  onReject,
  onApprove
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
              onClick={() => onReject(booking.id)}
            >
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onApprove(booking.id)}
            >
              Approve
            </Button>
          </>
        )}
        <Button
          variant="outline"
          onClick={() => onViewRoom(booking.room_id)}
        >
          View Room
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OwnerBookingCard;
