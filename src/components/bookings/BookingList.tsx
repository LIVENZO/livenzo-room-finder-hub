
import React from 'react';
import { Booking } from '@/services/BookingService';
import { Room } from '@/types/room';
import UserBookingCard from './UserBookingCard';
import OwnerBookingCard from './OwnerBookingCard';
import EmptyBookingState from './EmptyBookingState';

interface BookingListProps {
  bookings: Booking[];
  type: 'user' | 'owner';
  getRoomDetails: (roomId: string) => Room | undefined;
  onViewRoom: (roomId: string) => void;
  onCancelRequest?: (bookingId: string) => void;
  onReject?: (bookingId: string) => void;
  onApprove?: (bookingId: string) => void;
  onNavigate: (path: string) => void;
}

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  type,
  getRoomDetails,
  onViewRoom,
  onCancelRequest,
  onReject,
  onApprove,
  onNavigate
}) => {
  if (bookings.length === 0) {
    return <EmptyBookingState type={type} onNavigate={onNavigate} />;
  }

  return (
    <div className="grid gap-6">
      {bookings.map((booking) => {
        const room = getRoomDetails(booking.room_id);
        
        if (type === 'user') {
          return (
            <UserBookingCard
              key={booking.id}
              booking={booking}
              room={room}
              onViewRoom={onViewRoom}
              onCancelRequest={onCancelRequest!}
            />
          );
        }
        
        return (
          <OwnerBookingCard
            key={booking.id}
            booking={booking}
            room={room}
            onViewRoom={onViewRoom}
            onReject={onReject!}
            onApprove={onApprove!}
          />
        );
      })}
    </div>
  );
};

export default BookingList;
