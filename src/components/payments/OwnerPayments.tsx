import { OwnerPaymentsList } from "./OwnerPaymentsList";
import { OwnerUpiSettings } from "./OwnerUpiSettings";
import { PaymentConfigurationBanner } from "./PaymentConfigurationBanner";
import { useAuth } from "@/context/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const OwnerPayments = () => {
  const { user } = useAuth();
  const [hasUpiConfigured, setHasUpiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUpiConfiguration();
  }, [user]);

  const checkUpiConfiguration = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check owner_upi_details first
      const { data: upiDetails } = await supabase
        .from('owner_upi_details')
        .select('upi_id')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (upiDetails?.upi_id) {
        setHasUpiConfigured(true);
        setLoading(false);
        return;
      }

      // Fallback to user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('upi_id')
        .eq('id', user.id)
        .maybeSingle();

      setHasUpiConfigured(!!profile?.upi_id);
    } catch (error) {
      console.error('Error checking UPI configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <PaymentConfigurationBanner 
        isOwner={true} 
        hasUpiConfigured={hasUpiConfigured} 
      />
      
      {/* UPI Payment Settings */}
      <OwnerUpiSettings />
      
      {/* Payment History */}
      <OwnerPaymentsList />
    </div>
  );
};