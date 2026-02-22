import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Room } from '@/types/room';
import { useAuth } from '@/context/auth';
import BookingFlowSheet from './BookingFlowSheet';
import { getConfirmationFee } from './BookingPriceBreakdown';

interface StickyBottomBarProps {
  room: Room;
  actionCardRef: React.RefObject<HTMLDivElement>;
}

const StickyBottomBar = ({ room, actionCardRef }: StickyBottomBarProps) => {
  const { isOwner, user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);

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

  // Don't render the sticky bar for property owners
  if (isOwner) {
    return null;
  }

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
            <div className="flex items-center gap-4">
              <div className="w-1/3 min-w-fit">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground">
                    ₹{getConfirmationFee(room.price).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground -mt-0.5 leading-tight line-through">
                    ₹{room.price.toLocaleString()}/mo
                  </span>
                  <span className="text-[10px] text-green-600 -mt-0.5 leading-tight">
                    Save 25% first month
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <Button
                  onClick={handleBookNow}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
                >
                  <CalendarCheck className="h-5 w-5 mr-2" />
                  Free🚗drop to new room
                </Button>
              </div>
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
          userName={user.user_metadata?.full_name || user.user_metadata?.name || ''}
          userPhone={user.phone || user.user_metadata?.phone || ''}
          userEmail={user.email || ''}
        />
      )}
    </>
  );
};

export default StickyBottomBar;
