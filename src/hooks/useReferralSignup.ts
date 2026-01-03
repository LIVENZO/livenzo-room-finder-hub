import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Apply referral code for a newly signed up user.
 * This updates the existing referral row where referral_code matches and referred_id is NULL.
 */
export const applyReferralForNewUser = async (newUserId: string): Promise<boolean> => {
  const pendingCode = localStorage.getItem('pendingReferralCode');
  
  if (!pendingCode) {
    console.log('No pending referral code to apply');
    return false;
  }

  console.log('Applying referral code for new user:', newUserId, 'code:', pendingCode);

  try {
    // Check if user was already referred (shouldn't happen for new users, but safety check)
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', newUserId)
      .maybeSingle();

    if (existingReferral) {
      console.log('User already has a referral');
      localStorage.removeItem('pendingReferralCode');
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
      localStorage.removeItem('pendingReferralCode');
      return false;
    }

    // Prevent self-referral
    if (referralRow.referrer_id === newUserId) {
      console.log('Cannot use own referral code');
      localStorage.removeItem('pendingReferralCode');
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

    console.log('Referral successfully applied for user:', newUserId);
    localStorage.removeItem('pendingReferralCode');
    toast.success('Referral code applied! You\'ll get ₹200 OFF on your first booking.');
    return true;
  } catch (error) {
    console.error('Error in applyReferralForNewUser:', error);
    return false;
  }
};
