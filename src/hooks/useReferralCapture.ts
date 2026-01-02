import { useEffect } from 'react';

const REFERRAL_CODE_KEY = 'pendingReferralCode';

/**
 * Captures referral code from URL params and stores it in localStorage
 * for later use during signup
 */
export function useReferralCapture() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      console.log('Referral code captured from URL:', refCode);
      // Store the referral code for use during signup
      localStorage.setItem(REFERRAL_CODE_KEY, refCode);
      
      // Clean the URL by removing the ref parameter (optional, for cleaner UX)
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
}

/**
 * Gets the pending referral code from localStorage
 */
export function getPendingReferralCode(): string | null {
  return localStorage.getItem(REFERRAL_CODE_KEY);
}

/**
 * Clears the pending referral code from localStorage
 */
export function clearPendingReferralCode(): void {
  localStorage.removeItem(REFERRAL_CODE_KEY);
}
