import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Room } from '@/types/room';
import { useAuth } from '@/context/auth';
import { getRoomPricing } from '@/utils/pricingUtils';
import BookingFlowSheet from './BookingFlowSheet';
import { useBookVisit } from './BookVisitDialog';

interface StickyBottomBarProps {
  room: Room;
  actionCardRef: React.RefObject<HTMLDivElement>;
}

const StickyBottomBar = ({ room, actionCardRef }: StickyBottomBarProps) => {
  const { isOwner, user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const { openVisitDialog, visitDialog } = useBookVisit(room);
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
    setVisitDialogOpen(true);
  };

  const handleConfirmVisit = () => {
    if (!visitDate || !visitTime) {
      toast.error('Please select a date and time for your visit');
      return;
    }

    const hostelName = room.house_name || room.title || 'This property';
    const houseNumber = room.house_no || '';
    const propertyLine = houseNumber ? `${hostelName} - ${houseNumber}` : hostelName;

    const message = `Hi Livenzo,\n\nI'd like to book a visit for:\n🏠 ${propertyLine}\n\n📅 Date: ${visitDate}\n🕒 Time: ${visitTime}\n\nPlease confirm if this slot is available. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/917488698970?text=${encodedMessage}`, '_blank');
    setVisitDialogOpen(false);
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

      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Your Visit</DialogTitle>
            <DialogDescription>
              Pick a date and time for your visit to this property.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="visit-date" className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Visit Date
              </label>
              <input
                id="visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="visit-time" className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Visit Time
              </label>
              <input
                id="visit-time"
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmVisit}>
              Confirm & Open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StickyBottomBar;
