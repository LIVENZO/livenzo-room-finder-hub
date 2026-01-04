import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';

const APP_URL = 'https://livenzo-room-finder-hub.lovable.app';
const REFERRAL_STORAGE_KEY = 'pendingReferralCode';

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
      // Store in sessionStorage for later use after signup
      sessionStorage.setItem(REFERRAL_STORAGE_KEY, refCode);
      console.log('Referral code captured:', refCode);
      return refCode;
    }
    
    return sessionStorage.getItem(REFERRAL_STORAGE_KEY);
  };

  // Get stored referral code
  const getStoredReferralCode = useCallback((): string | null => {
    return sessionStorage.getItem(REFERRAL_STORAGE_KEY);
  }, []);

  // Clear pending referral
  const clearPendingReferral = () => {
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
  };

  // Process referral after signup - ONLY for NEW users
  // Uses the database function that validates if user is new
  const processReferralForNewUser = async (): Promise<{ success: boolean; message: string }> => {
    const pendingCode = getStoredReferralCode();
    
    if (!pendingCode) {
      return { success: false, message: 'No referral code found' };
    }

    if (!user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      // Call the database function that handles all validation including new user check
      const { data, error } = await supabase.rpc('create_referral_event', {
        p_referral_code: pendingCode
      });

      // Always clear the stored code after processing
      clearPendingReferral();

      if (error) {
        console.error('Error processing referral:', error);
        return { success: false, message: error.message };
      }

      const result = data as { success: boolean; message: string; reason?: string };

      if (result.success) {
        console.log('Referral processed successfully for new user');
        toast.success('Referral applied! You\'ll get ₹200 OFF on your first booking.');
        return { success: true, message: 'Referral applied successfully!' };
      } else {
        console.log('Referral not applied:', result.reason, result.message);
        // Don't show error toast for "not_new_user" - it's expected behavior
        if (result.reason !== 'not_new_user') {
          console.log('Referral issue:', result.message);
        }
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error in processReferralForNewUser:', error);
      clearPendingReferral();
      return { success: false, message: 'Failed to process referral' };
    }
  };

  // Legacy function for backward compatibility
  const applyReferral = async (newUserId: string): Promise<boolean> => {
    const result = await processReferralForNewUser();
    return result.success;
  };

  // Get referral stats for current user
  const getReferralStats = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('referral_events')
        .select('*')
        .eq('referrer_id', user.id);

      if (error) {
        console.error('Error fetching referral stats:', error);
        return null;
      }

      const totalReferrals = data?.length || 0;
      const pendingRewards = data?.filter(r => r.reward_status === 'pending').length || 0;
      const completedRewards = data?.filter(r => r.reward_status === 'completed').length || 0;
      const totalEarned = completedRewards * 200;

      return {
        totalReferrals,
        pendingRewards,
        completedRewards,
        totalEarned,
        referrals: data || []
      };
    } catch (error) {
      console.error('Error in getReferralStats:', error);
      return null;
    }
  }, [user?.id]);

  return {
    referralCode,
    isLoading,
    getOrCreateReferralCode,
    getReferralLink,
    shareOnWhatsApp,
    captureReferralFromURL,
    getStoredReferralCode,
    applyReferral,
    processReferralForNewUser,
    clearPendingReferral,
    getReferralStats
  };
};
