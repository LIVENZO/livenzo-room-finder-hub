import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Share2, Loader2 } from 'lucide-react';

const ReferralBanner: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleReferralClick = async () => {
    if (!user) {
      toast.error('Please login to share your referral link');
      return;
    }

    setIsLoading(true);
    try {
      // Get or create referral code using the database function
      const { data, error } = await supabase.rpc('get_or_create_referral_code');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const referralCode = data[0].referral_code;
        const referralLink = `${window.location.origin}/?ref=${referralCode}`;
        
        const shareText = `🏠 Looking for a room in Kota? Use my referral code ${referralCode} and get ₹200 OFF on your first booking!\n\n${referralLink}`;
        
        // Check if Web Share API is available (mobile browsers)
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Livenzo - Find Rooms in Kota',
              text: shareText,
            });
            toast.success('Shared successfully!');
          } catch (shareError) {
            // User cancelled or share failed, fallback to WhatsApp
            openWhatsApp(shareText);
          }
        } else {
          // Desktop fallback - open WhatsApp Web
          openWhatsApp(shareText);
        }
      }
    } catch (error) {
      console.error('Error getting referral code:', error);
      toast.error('Failed to generate referral link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = (text: string) => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp to share...');
  };

  return (
    <button
      onClick={handleReferralClick}
      disabled={isLoading}
      className="w-full mb-4 p-4 bg-gradient-to-r from-accent/15 via-accent/10 to-primary/10 rounded-xl border border-accent/20 animate-fade-in cursor-pointer hover:border-accent/40 transition-all duration-200 hover:shadow-sm active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-center">
        <span className="text-lg">🤝</span>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
          <span className="font-semibold text-foreground">Refer a Friend</span>
          <span className="text-accent font-bold">Earn ₹200</span>
          <span className="text-muted-foreground text-sm">when they complete first booking</span>
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent ml-1" />
        ) : (
          <Share2 className="h-4 w-4 text-accent ml-1 hidden sm:inline" />
        )}
      </div>
    </button>
  );
};

export default ReferralBanner;
