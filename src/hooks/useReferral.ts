import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';

const APP_URL = 'https://livenzo-room-finder-hub.lovable.app';

export const useReferral = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get or create referral code for current user
  const getOrCreateReferralCode = async (): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Please login to share your referral code');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_or_create_referral_code');
      
      if (error) {
        console.error('Error getting referral code:', error);
        toast.error('Failed to generate referral code');
        return null;
      }

      if (data && data.length > 0) {
        const code = data[0].referral_code;
        setReferralCode(code);
        return code;
      }
      
      return null;
    } catch (error) {
      console.error('Error in getOrCreateReferralCode:', error);
      toast.error('Failed to generate referral code');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate referral link
  const getReferralLink = (code: string): string => {
    return `${APP_URL}/?ref=${code}`;
  };

  // Share on WhatsApp
  const shareOnWhatsApp = async () => {
    const code = referralCode || await getOrCreateReferralCode();
    
    if (!code) return;

    const link = getReferralLink(code);
    const message = encodeURIComponent(
      `🏠 Hey! I found this amazing room finder app - Livenzo!\n\n` +
      `Use my referral link and get ₹200 OFF on your first booking:\n${link}\n\n` +
      `Find your perfect PG/room today! 🎉`
    );

    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Capture referral code from URL and store in localStorage
  const captureReferralFromURL = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Store in localStorage for persistence across sessions
      localStorage.setItem('pendingReferralCode', refCode);
      console.log('Referral code captured from URL:', refCode);
      return refCode;
    }
    
    return localStorage.getItem('pendingReferralCode');
  };

  // Get pending referral code from storage
  const getPendingReferralCode = (): string | null => {
    return localStorage.getItem('pendingReferralCode');
  };

  // Clear pending referral
  const clearPendingReferral = () => {
    localStorage.removeItem('pendingReferralCode');
  };

  return {
    referralCode,
    isLoading,
    getOrCreateReferralCode,
    getReferralLink,
    shareOnWhatsApp,
    captureReferralFromURL,
    getPendingReferralCode,
    clearPendingReferral
  };
};
