import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Room } from '@/types/room';
import { useAuth } from '@/context/auth';

interface StickyBottomBarProps {
  room: Room;
  actionCardRef: React.RefObject<HTMLDivElement>;
}

const StickyBottomBar = ({ room, actionCardRef }: StickyBottomBarProps) => {
  const { isOwner } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // Don't render the sticky bar for property owners
  if (isOwner) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!actionCardRef.current) {
        setIsVisible(true);
        return;
      }

      const actionCardRect = actionCardRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Hide sticky bar when action card is visible in viewport
      // Show it when action card is scrolled out of view (above or below)
      const isActionCardVisible = actionCardRect.top < viewportHeight && actionCardRect.bottom > 100;
      
      setIsVisible(!isActionCardVisible);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [actionCardRef]);

  const handleOfflineVisit = () => {
    const message = `Hi, I want to schedule an offline visit for this room listed on Livenzo.

Room Details:
• Location: ${room.location}
• Rent: ₹${room.price.toLocaleString()}/month
• Room ID: ${room.id}

Please let me know a suitable time for visit.

Thank you.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/917488698970?text=${encodedMessage}`;
    const opened = window.open(whatsappUrl, '_blank');
    
    if (!opened) {
      toast.error("WhatsApp not installed");
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Backdrop blur and shadow */}
      <div className="bg-background/95 backdrop-blur-lg border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Left Section - Price (25%) */}
            <div className="w-1/4 min-w-fit">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  ₹{room.price.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground -mt-0.5">
                  / month
                </span>
              </div>
            </div>

            {/* Right Section - CTA Button (75%) */}
            <div className="flex-1">
              <Button
                onClick={handleOfflineVisit}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl"
              >
                <CalendarCheck className="h-5 w-5 mr-2" />
                Offline Visit
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="bg-background/95 h-safe-area-inset-bottom" />
    </div>
  );
};

export default StickyBottomBar;
