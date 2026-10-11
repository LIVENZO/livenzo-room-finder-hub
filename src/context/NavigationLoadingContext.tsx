import React, { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BottomNavigationDestination, PendingNavigation, navigationHasArrived, navigationWasRedirected } from '@/utils/navigationLoading';

interface NavigationLoadingValue {
  pending: PendingNavigation | null;
  beginNavigation: (destination: BottomNavigationDestination, pathname: string) => boolean;
  markReady: (pathname: string, key: string) => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingValue | null>(null);

export const NavigationLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const pendingRef = useRef<PendingNavigation | null>(null);

  const clear = useCallback(() => {
    pendingRef.current = null;
    setPending(null);
  }, []);

  const beginNavigation = useCallback((destination: BottomNavigationDestination, pathname: string) => {
    if (pendingRef.current?.destination === destination) return false;
    const request = { destination, pathname, originKey: location.key };
    pendingRef.current = request;
    setPending(request);
    return true;
  }, [location.key]);

  const markReady = useCallback((pathname: string, key: string) => {
    const request = pendingRef.current;
    if (request && navigationHasArrived(request, pathname, key)) clear();
  }, [clear]);

  useLayoutEffect(() => {
    const request = pendingRef.current;
    // Preserve existing auth/back redirects without leaving an orphaned loader.
    if (request && navigationWasRedirected(request, location.pathname, location.key)) clear();
  }, [location.pathname, location.key, clear]);

  return (
    <NavigationLoadingContext.Provider value={{ pending, beginNavigation, markReady }}>
      {children}
      {pending && (
        <div
          role="status"
          aria-label={`Loading ${pending.destination}`}
          aria-live="polite"
          className="fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[55] flex items-center justify-center bg-background md:hidden"
        >
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
            <p className="text-lg text-muted-foreground">Loading {pending.destination === 'Profile' ? 'your profile' : pending.destination}...</p>
          </div>
        </div>
      )}
    </NavigationLoadingContext.Provider>
  );
};

export const useNavigationLoading = () => {
  const context = useContext(NavigationLoadingContext);
  if (!context) throw new Error('Navigation loading requires NavigationLoadingProvider');
  return context;
};

export const useNavigationReady = (ready: boolean) => {
  const location = useLocation();
  const { markReady } = useNavigationLoading();
  useLayoutEffect(() => {
    if (ready) markReady(location.pathname, location.key);
  }, [ready, location.pathname, location.key, markReady]);
};