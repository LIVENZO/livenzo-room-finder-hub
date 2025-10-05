import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  electricBillAmount?: number;
  relationshipId?: string;
  rentId?: string;
  onSuccess: (paymentDetails: any) => void;
  onFailure: (error: string) => void;
}

// Global type declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const RazorpayPaymentModal = ({ 
  isOpen, 
  onClose, 
  amount,
  electricBillAmount = 0,
  relationshipId,
  rentId,
  onSuccess, 
  onFailure 
}: RazorpayPaymentModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (customAmount?: number) => {
    setIsProcessing(true);
    
    try {
      const payAmount = typeof customAmount === 'number' ? customAmount : amount;
      
      // Get authentication token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Create payment order with proper error handling
      const result = await supabase.functions.invoke('create-payment-order', {
        body: { 
          amount: payAmount,
          electricBillAmount: electricBillAmount > 0 ? electricBillAmount : undefined,
          relationshipId,
          rentId,
          paymentMethod: 'razorpay'
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      const { data: orderData, error: orderError } = result;

      if (orderError) {
        console.error('Error creating payment order:', orderError);
        const message = (orderError as any)?.message || (orderError as any)?.error || 'Failed to create payment order';
        throw new Error(message);
      }

      if (!orderData?.success || !orderData?.razorpayOrderId) {
        console.error('Invalid response:', orderData);
        throw new Error('Invalid payment order response');
      }

      // Load Razorpay script (reuse if already loaded)
      if (window.Razorpay) {
        const options = {
          key: orderData.razorpayKeyId,
          amount: orderData.amount, // Amount in paise from backend order
          currency: 'INR',
          name: 'Livenzo',
          description: 'Rent Payment',
          order_id: orderData.razorpayOrderId,
          config: {
            display: {
              blocks: {
                banks: {
                  name: 'Pay using UPI or other methods',
                  instruments: [
                    {
                      method: 'upi'
                    },
                    {
                      method: 'card'
                    },
                    {
                      method: 'netbanking'
                    },
                    {
                      method: 'wallet'
                    }
                  ]
                }
              },
              sequence: ['block.banks'],
              preferences: {
                show_default_blocks: false
              }
            }
          },
          prefill: {
            method: 'upi'
          },
          handler: async (response: any) => {
            try {
              // Verify payment
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

              if (verifyError) {
                console.error('Payment verification failed:', verifyError);
                onFailure('Payment verification failed. Please contact support.');
                return;
              }

              console.log('Payment verified successfully');
              onSuccess({
                ...response,
                paymentId: orderData.paymentId
              });
            } catch (error) {
              console.error('Payment verification error:', error);
              onFailure('Payment verification failed. Please contact support.');
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              onFailure('Payment cancelled');
            }
          },
          theme: { color: '#3B82F6' }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setIsProcessing(false);
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const options = {
            key: orderData.razorpayKeyId,
            amount: orderData.amount, // Amount in paise from backend order
            currency: 'INR',
            name: 'Livenzo',
            description: 'Rent Payment',
            order_id: orderData.razorpayOrderId,
            config: {
              display: {
                blocks: {
                  banks: {
                    name: 'Pay using UPI or other methods',
                    instruments: [
                      {
                        method: 'upi'
                      },
                      {
                        method: 'card'
                      },
                      {
                        method: 'netbanking'
                      },
                      {
                        method: 'wallet'
                      }
                    ]
                  }
                },
                sequence: ['block.banks'],
                preferences: {
                  show_default_blocks: false
                }
              }
            },
            prefill: {
              method: 'upi'
            },
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

                if (verifyError) {
                  console.error('Payment verification failed:', verifyError);
                  onFailure('Payment verification failed. Please contact support.');
                  return;
                }

                onSuccess({ ...response, paymentId: orderData.paymentId });
              } catch (error) {
                console.error('Payment verification error:', error);
                onFailure('Payment verification failed. Please contact support.');
              }
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
                onFailure('Payment cancelled');
              }
            },
            theme: { color: '#3B82F6' }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
          setIsProcessing(false);
        };
        script.onerror = () => {
          setIsProcessing(false);
          onFailure('Failed to load payment gateway');
        };
        document.body.appendChild(script);
      }

    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      onFailure(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Razorpay Payment</DialogTitle>
          <DialogDescription>
            Secure payment processing via Razorpay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-3xl font-bold">₹{amount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Multiple Payment Options</p>
                <p className="text-blue-700">UPI, Cards, Net Banking, and Wallets</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <div className="text-sm">
                <p className="font-medium text-green-900">Secure & Instant</p>
                <p className="text-green-700">Bank-grade security with instant confirmation</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handlePayment()}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <Shield className="h-4 w-4 inline mr-1" />
            Powered by Razorpay - Your payment is secure
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};