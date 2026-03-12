import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Calendar } from 'lucide-react';
import { Room } from '@/types/room';
import { useAuth } from '@/context/AuthContext';
import { getRoomPricing } from '@/utils/pricingUtils';
import { useOfferStatus } from '@/hooks/useOfferStatus';

import { toast } from 'sonner';
import BookingFlowSheet from './BookingFlowSheet';
import BookingPriceBreakdown from './BookingPriceBreakdown';

interface RoomActionCardProps {
  room: Room;
  ownerPhone: string | null;
  onCallOwner: () => void;
}

const RoomActionCard: React.FC<RoomActionCardProps> = ({
  room,
  ownerPhone,
  onCallOwner
}) => {
  const { user } = useAuth();
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const { isDiscountActive } = useOfferStatus();
  const pricing = getRoomPricing(room);
  // Monthly rent = minimum_price if available, otherwise price
  const monthlyRent = room.minimum_price != null ? room.minimum_price : room.price;

  // Check if current user is the owner
  const isOwner = user?.id === room.ownerId;

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please login to book a room');
      return;
    }
    setBookingSheetOpen(true);
  };

  return (
    <>
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold">
              ₹{isOwner ? room.price.toLocaleString() : (isDiscountActive ? monthlyRent.toLocaleString() : room.price.toLocaleString())}
            </span>
            <span className="text-base font-normal text-muted-foreground">/month</span>
            {!isOwner && isDiscountActive && room.minimum_price != null && room.minimum_price !== room.price && (
              <span className="text-base text-muted-foreground line-through">
                ₹{room.price.toLocaleString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Availability Badge */}
          <Badge
            variant={room.available ? "default" : "secondary"}
            className={room.available ? "bg-green-100 text-green-800" : ""}>
            {room.available ? "Available" : "Not Available"}
          </Badge>

          {/* First Month Discount Breakdown */}
          {!isOwner && <BookingPriceBreakdown monthlyRent={room.price} room={room} variant="compact" />}
          
          {/* Chat Support & Call Owner Buttons - Hidden for property owner */}
          {!isOwner &&
          <div className="flex gap-2 w-full">
              {/* Offline Visit Button */}
              <Button
              className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white"
              onClick={() => {
                const facilities = room.facilities || {};
                const roomType = facilities.roomType === 'single' ? 'Single' : facilities.roomType === 'sharing' ? 'Sharing' : 'Room';
                const gender = facilities.gender === 'male' ? 'Boys' : facilities.gender === 'female' ? 'Girls' : 'Any';
                const message = `Hi Livenzo,

I want to schedule an offline visit for ${room.title}

₹${pricing.finalPrice.toLocaleString()} | ${roomType} room | ${gender}

${room.house_name || ''}, ${room.location}

Room ID: ${room.id}

Please help me schedule a visit.`;
                const encodedMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/917488698970?text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
              }}>
                🏠 Offline Visit
              </Button>
              
              {/* Call Button */}
              <Button
              variant="outline"
              className="flex-1 border-primary/30 hover:bg-primary/5 hover:border-primary/50"
              onClick={onCallOwner}>
                <Calendar className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          }
          
          {/* Book & Pay After Shift Button - Primary CTA, Hidden for property owner */}
          {!isOwner &&
          <Button
            className="w-full"
            onClick={handleBookNow}>
              <CalendarCheck className="h-4 w-4 mr-2" />
              Book & Pay After Shift
            </Button>
          }
        </CardContent>
      </Card>

      {/* Booking Flow Sheet */}
      {user &&
      <BookingFlowSheet
        open={bookingSheetOpen}
        onOpenChange={setBookingSheetOpen}
        roomId={room.id}
        userId={user.id}
        roomTitle={room.title}
        roomPrice={room.price}
        room={room}
        userName={user.user_metadata?.full_name || user.user_metadata?.name || ''}
        userPhone={user.phone || user.user_metadata?.phone || ''}
        userEmail={user.email || ''} />
      }
    </>);
};

export default RoomActionCard;
