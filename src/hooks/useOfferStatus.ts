import { useState, useEffect, useCallback } from 'react';

export type OfferStatus = 'active_7_day' | 'expired' | 'lucky_24h' | 'fully_expired';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY_START = 'livenzo_offer_start';
const STORAGE_KEY_LUCKY = 'livenzo_lucky_start';

const getStoredNumber = (key: string): number | null => {
  const v = localStorage.getItem(key);
  return v ? parseInt(v, 10) : null;
};

const computeStatus = (): { status: OfferStatus; remaining: number } => {
  const now = Date.now();

  // Check lucky 24h first (takes priority)
  const luckyStart = getStoredNumber(STORAGE_KEY_LUCKY);
  if (luckyStart) {
    const luckyEnd = luckyStart + TWENTY_FOUR_HOURS_MS;
    const luckyLeft = luckyEnd - now;
    if (luckyLeft > 0) {
      return { status: 'lucky_24h', remaining: luckyLeft };
    }
    // Full cycle complete → restart with fresh 7-day offer
    localStorage.removeItem(STORAGE_KEY_LUCKY);
    localStorage.setItem(STORAGE_KEY_START, now.toString());
    return { status: 'active_7_day', remaining: SEVEN_DAYS_MS };
  }

  // Check 7-day offer
  let offerStart = getStoredNumber(STORAGE_KEY_START);
  if (!offerStart) {
    offerStart = now;
    localStorage.setItem(STORAGE_KEY_START, now.toString());
  }

  const sevenDayEnd = offerStart + SEVEN_DAYS_MS;
  const sevenDayLeft = sevenDayEnd - now;

  if (sevenDayLeft > 0) {
    return { status: 'active_7_day', remaining: sevenDayLeft };
  }

  return { status: 'expired', remaining: 0 };
};

export const useOfferStatus = () => {
  const [state, setState] = useState(computeStatus);

  useEffect(() => {
    if (state.remaining <= 0) return;
    const id = setInterval(() => {
      const next = computeStatus();
      setState(next);
      if (next.remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [state.status]);

  const unlockLuckyOffer = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_LUCKY, Date.now().toString());
    setState(computeStatus());
  }, []);

  const isDiscountActive = state.status === 'active_7_day' || state.status === 'lucky_24h';

  return {
    offerStatus: state.status,
    remaining: state.remaining,
    isDiscountActive,
    unlockLuckyOffer,
  };
};

/**
 * Lightweight check without React state — for use in utility functions.
 */
export const isOfferDiscountActive = (): boolean => {
  const { status } = computeStatus();
  return status === 'active_7_day' || status === 'lucky_24h';
};
