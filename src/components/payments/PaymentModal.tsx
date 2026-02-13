import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Smartphone, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { shouldUseExternalBrowser, openRazorpayInBrowser, storePendingPayment, checkPendingPayment, clearPendingPayment } from "@/utils/razorpayHelper";
import { App as CapApp } from '@capacitor/app';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  relationshipId: string;
  onSuccess: (paymentDetails?: any) => void;
  onFailure?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PaymentModal = ({ isOpen, onClose, amount, relationshipId, onSuccess, onFailure }: PaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Listen for app resume to check pending external payments
  useEffect(() => {
    if (!shouldUseExternalBrowser() || !isOpen) return;

    const listener = CapApp.addListener('appStateChange', async ({ isActive }) => {
      if (isActive && loading) {
        const result = await checkPendingPayment();
        if (result?.found && result.type === 'rent') {
          if (result.success) {
            clearPendingPayment();
            setLoading(false);
            toast({ title: "Payment Successful", description: "Your rent payment has been processed successfully" });
            onSuccess({ verified: true });
          } else {
            setTimeout(async () => {
              const retry = await checkPendingPayment();
              if (retry?.found && retry.success) {
                clearPendingPayment();
                setLoading(false);
                onSuccess({ verified: true });
              } else if (retry?.found) {
                clearPendingPayment();
                setLoading(false);
                onFailure?.("Payment was not completed. You can retry anytime.");
              }
            }, 3000);
          }
        }
      }
    });

    return () => { listener.then(l => l.remove()); };
  }, [isOpen, loading]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authHeader = sessionData?.session?.access_token
        ? { Authorization: `Bearer ${sessionData.session.access_token}` }
        : undefined;

      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-payment-order', {
        body: { amount, relationshipId },
        headers: authHeader
      });

      if (orderError) {
        throw new Error(orderError.message || 'Failed to create payment order');
      }

      // --- EXTERNAL BROWSER for Android Capacitor ---
      if (shouldUseExternalBrowser()) {
        storePendingPayment({ type: 'rent', paymentId: orderData.paymentId });
        
        await openRazorpayInBrowser({
          razorpayKeyId: orderData.razorpayKeyId,
          razorpayOrderId: orderData.razorpayOrderId,
          amount: orderData.amount,
          currency: orderData.currency,
          description: `Rent Payment for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          userEmail: user?.email || '',
          paymentId: orderData.paymentId,
          type: 'rent',
        });
        return;
      }

      // --- STANDARD MODAL for web browser ---
      if (!window.Razorpay) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Livenzo',
        description: `Rent Payment for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response: any) => {
          try {
            const { data: sessionData2 } = await supabase.auth.getSession();
            const authHeader2 = sessionData2?.session?.access_token
              ? { Authorization: `Bearer ${sessionData2.session.access_token}` }
              : undefined;
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: orderData.paymentId
              },
              headers: authHeader2
            });

            if (verifyError) throw verifyError;

            toast({ title: "Payment Successful", description: "Your rent payment has been processed successfully" });
            onSuccess(response);
          } catch (error) {
            const errorMessage = "Payment verification failed. Please contact support if amount was deducted.";
            toast({ title: "Payment Verification Failed", description: errorMessage, variant: "destructive" });
            onFailure?.(errorMessage);
          }
        },
        prefill: { email: user?.email || '' },
        theme: { color: '#8B5CF6' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            onFailure?.("Payment cancelled by user");
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      const errorMessage = "Failed to initiate payment. Please check your connection and try again.";
      toast({ title: "Payment Failed", description: errorMessage, variant: "destructive" });
      onFailure?.(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Rent</DialogTitle>
          <DialogDescription>
            Complete your rent payment securely using UPI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-3xl font-bold">₹{amount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">UPI Payment</p>
                <p className="text-sm text-muted-foreground">Pay using Google Pay, PhonePe, Paytm, or any UPI app</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Card Payment</p>
                <p className="text-sm text-muted-foreground">Credit/Debit cards also supported</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pay Now
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your payment is secured by Razorpay. We don't store your payment information.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
