import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

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
    // Lucky offer expired
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

export const useOfferStatus = () => {
  const [state, setState] = useState(computeStatus);
  const { user } = useAuth();

  // Check for admin-triggered restart from Supabase
  useEffect(() => {
    if (!user?.id) return;

    const checkAdminRestart = async () => {
      const { data } = await supabase
        .from('offer_overrides')
        .select('restarted_at')
        .eq('user_id', user.id)
        .order('restarted_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const restartTime = new Date(data[0].restarted_at).getTime();
        const currentStart = getStoredNumber(STORAGE_KEY_START);

        // Only apply if restart is newer than current offer start
        if (!currentStart || restartTime > currentStart) {
          localStorage.setItem(STORAGE_KEY_START, restartTime.toString());
          localStorage.removeItem(STORAGE_KEY_LUCKY);
          setState(computeStatus());
        }
      }
    };

    checkAdminRestart();
  }, [user?.id]);

  useEffect(() => {
    if (state.remaining <= 0) return;
    const id = setInterval(() => {
      const next = computeStatus();
      setState(next);
      if (next.remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [state.status]);

  const isDiscountActive = state.status === 'active_7_day' || state.status === 'lucky_24h';

  return {
    offerStatus: state.status,
    remaining: state.remaining,
    isDiscountActive,
  };
};

/**
 * Lightweight check without React state — for use in utility functions.
 */
export const isOfferDiscountActive = (): boolean => {
  const { status } = computeStatus();
  return status === 'active_7_day' || status === 'lucky_24h';
};
