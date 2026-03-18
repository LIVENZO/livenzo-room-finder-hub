import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Room } from '@/types/room';
import { useAuth } from '@/context/auth';
import { getRoomPricing } from '@/utils/pricingUtils';
import BookingFlowSheet from './BookingFlowSheet';

interface StickyBottomBarProps {
  room: Room;
  actionCardRef: React.RefObject<HTMLDivElement>;
}

const StickyBottomBar = ({ room, actionCardRef }: StickyBottomBarProps) => {
  const { isOwner, user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const pricing = getRoomPricing(room);

  useEffect(() => {
    const handleScroll = () => {
      if (!actionCardRef.current) {
        setIsVisible(true);
        return;
      }

      const actionCardRect = actionCardRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isActionCardVisible = actionCardRect.top < viewportHeight && actionCardRect.bottom > 100;
      setIsVisible(!isActionCardVisible);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [actionCardRef]);

  if (isOwner) {
    return null;
  }

  const handleBookVisit = () => {
    const facilities = room.facilities || {};
    const roomType = (facilities as any).roomType === 'single' ? 'Single' : (facilities as any).roomType === 'sharing' ? 'Sharing' : 'Room';
    const gender = (facilities as any).gender === 'male' ? 'Boys' : (facilities as any).gender === 'female' ? 'Girls' : 'Any';
    const message = `Hi Livenzo,

I want to schedule an offline visit for ${room.title}

₹${pricing.currentRoomPrice.toLocaleString()} | ${roomType} room | ${gender}

${room.house_name || ''}, ${room.location}

Room ID: ${room.id}

Please help me schedule a visit.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/917488698970?text=${encodedMessage}`, '_blank');
  };

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please login to book a room');
      return;
    }
    setBookingSheetOpen(true);
  };

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-background/95 backdrop-blur-lg border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="container max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleBookVisit}
                className="flex-1 h-12 rounded-full text-sm font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 active:scale-[0.97] transition-all duration-150"
              >
                Book a Visit
              </Button>
              <Button
                onClick={handleBookNow}
                className="flex-1 h-12 rounded-full text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.97] transition-all duration-150"
              >
                Book Now 🏠
              </Button>
            </div>
          </div>
        </div>
        <div className="bg-background/95 h-safe-area-inset-bottom" />
      </div>

      {user && (
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
          userEmail={user.email || ''}
        />
      )}
    </>
  );
};

export default StickyBottomBar;
