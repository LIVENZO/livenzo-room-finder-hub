import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Copy, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount: number;
  relationshipId: string;
  ownerUpiId: string;
  ownerName: string;
  onSuccess: () => void;
}

export const UpiPaymentModal = ({ 
  isOpen, 
  onClose, 
  initialAmount, 
  relationshipId, 
  ownerUpiId, 
  ownerName,
  onSuccess 
}: UpiPaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState(initialAmount);
  const [showPaymentButtons, setShowPaymentButtons] = useState(false);

  // Generate UPI payment URL
  const upiUrl = `upi://pay?pa=${ownerUpiId}&pn=${encodeURIComponent(ownerName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Rent Payment - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`)}`;

  // Reset amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount);
      setShowPaymentButtons(false);
    }
  }, [isOpen, initialAmount]);

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(ownerUpiId);
      setCopied(true);
      toast({
        title: "UPI ID Copied",
        description: "UPI ID has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy UPI ID. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  const handlePayWithUpi = () => {
    // Open UPI app with pre-filled details
    window.open(upiUrl, '_blank');
    setShowPaymentButtons(true);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      // Create payment record with manual confirmation
      const { data, error } = await supabase
        .from('payments')
        .insert({
          renter_id: user?.id,
          relationship_id: relationshipId,
          amount: amount,
          payment_method: 'upi',
          status: 'paid',
          payment_status: 'completed',
          payment_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update rent status to paid and set next due date
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1); // Set to first day of next month
      
      const { error: rentStatusError } = await supabase
        .from('rent_status')
        .update({
          status: 'paid',
          last_payment_id: data.id,
          due_date: nextMonth.toISOString().split('T')[0], // Format as YYYY-MM-DD
          updated_at: new Date().toISOString()
        })
        .eq('relationship_id', relationshipId);

      if (rentStatusError) {
        console.error('Rent status update error:', rentStatusError);
      }

      toast({
        title: "Payment Confirmed",
        description: "Your payment has been recorded successfully",
      });

      onSuccess();
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      toast({
        title: "Confirmation Failed",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            UPI Payment
          </DialogTitle>
          <DialogDescription>
            Pay rent using any UPI app like PhonePe, Google Pay, or Paytm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Rent Amount</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="text-3xl font-bold bg-transparent border-b-2 border-primary/30 text-center w-32 focus:outline-none focus:border-primary"
                    disabled={showPaymentButtons}
                  />
                </div>
                <p className="text-xs text-muted-foreground">To: {ownerName}</p>
                <p className="text-xs text-muted-foreground">You can edit the amount to include electricity bill if needed</p>
              </div>
            </CardContent>
          </Card>

          {/* UPI ID Display */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-center">Owner's UPI ID</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-sm font-mono">{ownerUpiId}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUpiId}
                    className="h-8 w-8 p-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {showPaymentButtons && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Payment Status:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs font-medium text-white">✓</div>
                  <span>UPI app opened successfully</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">2</div>
                  <span>Complete payment in your UPI app</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">3</div>
                  <span>Come back and tap "Mark as Paid"</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {!showPaymentButtons ? (
              <>
                <Button 
                  onClick={handlePayWithUpi}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Pay via UPI App
                </Button>
                
                <Button 
                  onClick={handleCopyUpiId}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {copied ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy UPI ID
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={handlePayWithUpi}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Open UPI App Again
                </Button>
                
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mark as Paid
                </Button>
              </>
            )}
            
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          {showPaymentButtons && (
            <p className="text-xs text-muted-foreground text-center">
              Only tap "Mark as Paid" after successful transaction in your UPI app
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};