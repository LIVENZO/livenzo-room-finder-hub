import React from 'react';
import { Home, MapPin, Search, Share2, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavigationAction = 'search' | 'near-me';

interface NavigationState {
  bottomNavAction?: NavigationAction;
  requestId?: number;
}

const SHARE_URL = 'https://www.livenzo.site';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as NavigationState | null;

  const openListings = (action?: NavigationAction) => {
    navigate('/find-room', {
      state: action ? { bottomNavAction: action, requestId: Date.now() } : null,
    });
  };

  const shareLivenzo = async () => {
    const shareData = {
      title: 'Livenzo',
      text: 'Find PGs, hostels and rooms in Kota with Livenzo.',
      url: SHARE_URL,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(SHARE_URL);
      toast.success('Livenzo link copied');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Unable to share Livenzo');
    }
  };

  const searchAction = location.pathname === '/find-room' ? state?.bottomNavAction : undefined;
  const listingsActive = location.pathname === '/find-room' || location.pathname.startsWith('/room/');

  const items = [
    {
      label: 'Home',
      icon: Home,
      active: listingsActive && !searchAction,
      onClick: () => openListings(),
    },
    {
      label: 'Search',
      icon: Search,
      active: searchAction === 'search',
      onClick: () => openListings('search'),
    },
    {
      label: 'Share',
      icon: Share2,
      active: false,
      onClick: shareLivenzo,
    },
    {
      label: 'Near Me',
      icon: MapPin,
      active: searchAction === 'near-me',
      onClick: () => openListings('near-me'),
    },
    {
      label: 'Profile',
      icon: User,
      active: location.pathname === '/profile',
      onClick: () => navigate('/profile'),
    },
  ];

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_hsl(var(--foreground)/0.08)] backdrop-blur-lg md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {items.map(({ label, icon: Icon, active, onClick }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            onClick={onClick}
            className={cn(
              'h-16 min-w-0 flex-col gap-1 rounded-none px-1 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors',
              'hover:bg-primary/5 hover:text-primary',
              active && 'bg-primary/5 text-primary'
            )}
          >
            <span className={cn('flex h-7 w-10 items-center justify-center rounded-full transition-colors', active && 'bg-primary/10')}>
              <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 2} />
            </span>
            <span className="w-full truncate">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;