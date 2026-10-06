import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Home, Loader2, MapPin, Search, Share2, User, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRooms } from '@/context/RoomContext';
import { useReferral } from '@/hooks/useReferral';

type NavigationAction = 'search' | 'near-me';
type NavigationLabel = 'Home' | 'Search' | 'Share' | 'Near Me' | 'Profile';

interface NavigationState {
  bottomNavAction?: NavigationAction;
  requestId?: number;
}

interface NavigationButtonProps {
  label: NavigationLabel;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  onActivate: (label: NavigationLabel) => void;
}

const NavigationButton = memo(({ label, icon: Icon, active, onActivate }: NavigationButtonProps) => {
  const pointerHandledRef = useRef(false);

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onPointerDown={(event) => {
        if (event.button !== 0 || pointerHandledRef.current) return;
        pointerHandledRef.current = true;
        onActivate(label);
      }}
      onClick={() => {
        if (pointerHandledRef.current) {
          pointerHandledRef.current = false;
          return;
        }
        onActivate(label);
      }}
      onPointerCancel={() => {
        pointerHandledRef.current = false;
      }}
      className={cn(
        'h-16 min-w-0 touch-manipulation flex-col gap-1 rounded-none px-1 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors',
        'hover:bg-primary/5 hover:text-primary',
        active && 'bg-primary/5 text-primary'
      )}
    >
      <span className={cn('flex h-7 w-10 items-center justify-center rounded-full transition-colors', active && 'bg-primary/10')}>
        <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className="w-full truncate">{label}</span>
    </Button>
  );
});

NavigationButton.displayName = 'NavigationButton';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { nearMeActive } = useRooms();
  const { shareOnWhatsApp, isLoading } = useReferral();
  const [referralOpen, setReferralOpen] = useState(false);
  const [pendingLabel, setPendingLabel] = useState<NavigationLabel | null>(null);
  const lastActivationRef = useRef<{ label: NavigationLabel; timestamp: number } | null>(null);
  const state = location.state as NavigationState | null;

  useEffect(() => {
    setPendingLabel(null);
  }, [location.key, referralOpen]);

  const openListings = useCallback((action?: NavigationAction) => {
    navigate('/find-room', {
      state: action ? { bottomNavAction: action, requestId: Date.now() } : null,
      flushSync: true,
    });
  }, [navigate]);

  const handleReferralShare = async () => {
    const shared = await shareOnWhatsApp();
    if (shared) setReferralOpen(false);
  };

  const searchAction = location.pathname === '/find-room' ? state?.bottomNavAction : undefined;
  const listingsActive = location.pathname === '/find-room' || location.pathname.startsWith('/room/');

  const items = useMemo(() => [
    {
      label: 'Home' as const,
      icon: Home,
      active: listingsActive && !searchAction && !nearMeActive,
      onClick: () => openListings(),
    },
    {
      label: 'Search' as const,
      icon: Search,
      active: searchAction === 'search',
      onClick: () => openListings('search'),
    },
    {
      label: 'Share' as const,
      icon: Share2,
      active: referralOpen,
      onClick: () => setReferralOpen(true),
    },
    {
      label: 'Near Me' as const,
      icon: MapPin,
      active: searchAction === 'near-me' || (location.pathname === '/find-room' && nearMeActive),
      onClick: () => openListings('near-me'),
    },
    {
      label: 'Profile' as const,
      icon: User,
      active: location.pathname === '/profile',
      onClick: () => navigate('/profile', { flushSync: true }),
    },
  ], [listingsActive, location.pathname, nearMeActive, navigate, openListings, referralOpen, searchAction]);

  const activateItem = useCallback((label: NavigationLabel) => {
    const now = performance.now();
    const lastActivation = lastActivationRef.current;
    if (lastActivation?.label === label && now - lastActivation.timestamp < 500) return;

    lastActivationRef.current = { label, timestamp: now };
    setPendingLabel(label);
    items.find((item) => item.label === label)?.onClick();
  }, [items]);

  return (
    <>
      <nav
        data-mobile-bottom-navigation
        aria-label="Primary mobile navigation"
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_hsl(var(--foreground)/0.08)] backdrop-blur-lg md:hidden"
      >
        <div className="grid h-16 grid-cols-5">
          {items.map(({ label, icon, active }) => (
            <NavigationButton
              key={label}
              label={label}
              icon={icon}
              active={pendingLabel ? pendingLabel === label : active}
              onActivate={activateItem}
            />
          ))}
        </div>
      </nav>

      <Dialog open={referralOpen} onOpenChange={setReferralOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg border-primary/15 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-6 w-6" aria-hidden="true" />
          </div>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-xl">Refer a Friend</DialogTitle>
            <DialogDescription className="pt-1 text-sm leading-relaxed">
              Earn ₹500 when your friend completes their first booking.
            </DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            onClick={handleReferralShare}
            disabled={isLoading}
            className="mt-1 h-11 w-full rounded-full font-semibold"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {isLoading ? 'Preparing link...' : 'Share Now'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BottomNavigation;