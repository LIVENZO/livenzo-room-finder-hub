import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    // Lucky offer expired — permanently done until admin reset
    return { status: 'fully_expired', remaining: 0 };
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

/**
 * Check if admin has triggered a manual offer reset via the offer_overrides table.
 * If restarted_at is newer than the current offer cycle, reset localStorage.
 */
const checkAdminReset = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('offer_overrides')
      .select('restarted_at')
      .eq('user_id', userId)
      .order('restarted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return false;

    const restartedAt = new Date(data.restarted_at).getTime();
    const offerStart = getStoredNumber(STORAGE_KEY_START);

    // Reset only if admin restart is newer than current offer cycle start
    if (!offerStart || restartedAt > offerStart) {
      localStorage.setItem(STORAGE_KEY_START, restartedAt.toString());
      localStorage.removeItem(STORAGE_KEY_LUCKY);
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const useOfferStatus = () => {
  const [state, setState] = useState(computeStatus);

  // Check for admin-triggered reset on mount
  useEffect(() => {
    const checkReset = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const wasReset = await checkAdminReset(session.user.id);
      if (wasReset) {
        setState(computeStatus());
      }
    };
    checkReset();
  }, []);

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
