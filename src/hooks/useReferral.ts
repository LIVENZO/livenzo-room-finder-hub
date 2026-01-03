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

  // Capture referral code from URL
  const captureReferralFromURL = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Store in sessionStorage for later use
      sessionStorage.setItem('pendingReferralCode', refCode);
      return refCode;
    }
    
    return sessionStorage.getItem('pendingReferralCode');
  };

  // Apply referral after signup
  const applyReferral = async (newUserId: string): Promise<boolean> => {
    const pendingCode = sessionStorage.getItem('pendingReferralCode');
    
    if (!pendingCode) {
      console.log('No pending referral code to apply');
      return false;
    }

    try {
      // Check if user was already referred
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', newUserId)
        .maybeSingle();

      if (existingReferral) {
        console.log('User already has a referral');
        sessionStorage.removeItem('pendingReferralCode');
        return false;
      }

      // Get referrer from the code
      const { data: referrerData } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referral_code', pendingCode)
        .is('referred_id', null)
        .maybeSingle();

      if (!referrerData) {
        console.log('Invalid or already used referral code');
        sessionStorage.removeItem('pendingReferralCode');
        return false;
      }

      // Prevent self-referral
      if (referrerData.referrer_id === newUserId) {
        console.log('Cannot use own referral code');
        sessionStorage.removeItem('pendingReferralCode');
        toast.error('You cannot use your own referral code');
        return false;
      }

      // Apply the referral using the RPC function
      const { data: applied, error } = await supabase.rpc('apply_referral_code', {
        p_referral_code: pendingCode
      });

      if (error) {
        console.error('Error applying referral:', error);
        return false;
      }

      if (applied) {
        sessionStorage.removeItem('pendingReferralCode');
        toast.success('Referral code applied! You\'ll get ₹200 OFF on your first booking.');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in applyReferral:', error);
      return false;
    }
  };

  // Clear pending referral
  const clearPendingReferral = () => {
    sessionStorage.removeItem('pendingReferralCode');
  };

  return {
    referralCode,
    isLoading,
    getOrCreateReferralCode,
    getReferralLink,
    shareOnWhatsApp,
    captureReferralFromURL,
    applyReferral,
    clearPendingReferral
  };
};
