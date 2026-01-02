import { supabase } from '@/integrations/supabase/client';

/**
 * Applies a referral code for a newly signed up user.
 * This should only be called once during the first signup.
 * 
 * @param referralCode - The referral code to apply
 * @param newUserId - The UUID of the newly signed up user
 * @returns true if referral was successfully applied, false otherwise
 */
export async function applyReferralForNewUser(
  referralCode: string,
  newUserId: string
): Promise<boolean> {
  try {
    console.log('Attempting to apply referral code:', referralCode, 'for user:', newUserId);
    
    // First, check if this user has already been referred (prevent duplicate referrals)
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', newUserId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing referral:', checkError);
      return false;
    }
    
    if (existingReferral) {
      console.log('User already has a referral, skipping');
      return false;
    }
    
    // Find the referral entry with this code that hasn't been used yet
    const { data: referralData, error: findError } = await supabase
      .from('referrals')
      .select('id, referrer_id, referred_id')
      .eq('referral_code', referralCode)
      .is('referred_id', null)
      .maybeSingle();
    
    if (findError) {
      console.error('Error finding referral:', findError);
      return false;
    }
    
    if (!referralData) {
      console.log('Referral code not found or already used:', referralCode);
      return false;
    }
    
    // Prevent self-referral
    if (referralData.referrer_id === newUserId) {
      console.log('Self-referral prevented');
      return false;
    }
    
    // Update the referral with the referred user's ID and status
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        referred_id: newUserId,
        status: 'signed_up',
        updated_at: new Date().toISOString()
      })
      .eq('id', referralData.id);
    
    if (updateError) {
      console.error('Error updating referral:', updateError);
      return false;
    }
    
    console.log('Referral successfully applied for user:', newUserId);
    return true;
  } catch (error) {
    console.error('Error applying referral:', error);
    return false;
  }
}

/**
 * Checks if a user is a first-time user (newly created)
 * by checking if their account was created within the last minute
 */
export function isNewUser(createdAt: string): boolean {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  return (now - createdTime) < oneMinute;
}
