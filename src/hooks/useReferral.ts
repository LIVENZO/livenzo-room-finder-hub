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

  // Apply referral after signup - updates existing row in referrals table
  const applyReferral = async (newUserId: string, isNewUser: boolean = false): Promise<boolean> => {
    const pendingCode = sessionStorage.getItem('pendingReferralCode');
    
    if (!pendingCode) {
      console.log('No pending referral code to apply');
      return false;
    }

    // Only apply referral for new users
    if (!isNewUser) {
      console.log('User is not new, skipping referral application');
      sessionStorage.removeItem('pendingReferralCode');
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

      // Get referrer's referral row matching the code
      const { data: referralRow } = await supabase
        .from('referrals')
        .select('id, referrer_id')
        .eq('referral_code', pendingCode)
        .is('referred_id', null)
        .maybeSingle();

      if (!referralRow) {
        console.log('Invalid or already used referral code');
        sessionStorage.removeItem('pendingReferralCode');
        return false;
      }

      // Prevent self-referral
      if (referralRow.referrer_id === newUserId) {
        console.log('Cannot use own referral code');
        sessionStorage.removeItem('pendingReferralCode');
        toast.error('You cannot use your own referral code');
        return false;
      }

      // Update the existing referral row with the new user's ID and set status to pending
      const { error } = await supabase
        .from('referrals')
        .update({
          referred_id: newUserId,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', referralRow.id)
        .is('referred_id', null); // Extra safety check

      if (error) {
        console.error('Error applying referral:', error);
        return false;
      }

      sessionStorage.removeItem('pendingReferralCode');
      toast.success('Referral code applied! You\'ll get ₹200 OFF on your first booking.');
      return true;
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
