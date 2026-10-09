import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { destinationIsReady, type BottomNavigationLabel, type PendingNavigation } from './navigationFeedbackState';

interface FeedbackContextValue {
  pending: PendingNavigation | null;
  begin: (label: BottomNavigationLabel, destination: string) => boolean;
  finishShare: () => void;
  report: (pathname: string, key: string, loading: boolean) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function NavigationFeedbackProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const pendingRef = useRef<PendingNavigation | null>(null);

  const clear = useCallback(() => {
    pendingRef.current = null;
    setPending(null);
  }, []);

  const begin = useCallback((label: BottomNavigationLabel, destination: string) => {
    if (pendingRef.current?.label === label) return false;
    const next = { label, destination, originKey: location.key };
    pendingRef.current = next;
    setPending(next);
    return true;
  }, [location.key]);

  const report = useCallback((pathname: string, key: string, loading: boolean) => {
    const current = pendingRef.current;
    if (current && destinationIsReady(current, pathname, key, loading)) clear();
  }, [clear]);

  const finishShare = useCallback(() => {
    if (pendingRef.current?.label === 'Share') clear();
  }, [clear]);

  useEffect(() => {
    const current = pendingRef.current;
    // Authentication redirects and other destinations must not leave a stale spinner.
    if (current && location.key !== current.originKey && location.pathname !== current.destination) clear();
  }, [location.key, location.pathname, clear]);

  return <FeedbackContext.Provider value={{ pending, begin, report, finishShare }}>{children}</FeedbackContext.Provider>;
}

export function useNavigationFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('Navigation feedback requires its provider');
  return context;
}

export function useNavigationDestinationLoading(loading: boolean) {
  const { report } = useNavigationFeedback();
  const location = useLocation();
  useEffect(() => {
    report(location.pathname, location.key, loading);
  }, [report, location.pathname, location.key, loading]);
}