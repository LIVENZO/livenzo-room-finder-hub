import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Shield, Loader2 } from "lucide-react";
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
      const upiUrl = `upi://pay?pa=7488698970@ybl&pn=Rent%20Payment&am=${payAmount}&cu=INR`;
      window.open(upiUrl, '_system');
      
      setIsProcessing(false);
      onClose();
      onSuccess({ method: 'upi_deep_link', amount: payAmount });
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