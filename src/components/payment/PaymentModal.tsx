
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Smartphone, Building } from 'lucide-react';
import { toast } from 'sonner';
import { createPayment, updatePaymentStatus, updateRentStatus } from '@/services/PaymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationshipId: string;
  ownerId: string;
  initialAmount: number;
  onPaymentSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  relationshipId,
  ownerId,
  initialAmount,
  onPaymentSuccess
}) => {
  const [amount, setAmount] = useState(initialAmount);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment record
      const payment = await createPayment({
        relationship_id: relationshipId,
        owner_id: ownerId,
        amount: amount,
        payment_method: paymentMethod
      });

      // For demo purposes, we'll simulate Razorpay integration
      // In a real implementation, you would integrate with Razorpay SDK
      await simulatePayment(payment.id);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const simulatePayment = async (paymentId: string) => {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful payment
    const mockTransactionId = `TXN${Date.now()}`;
    const mockRazorpayId = `pay_${Date.now()}`;

    try {
      await updatePaymentStatus(paymentId, 'completed', mockRazorpayId, mockTransactionId);
      await updateRentStatus(relationshipId, 'paid', paymentId);
      
      toast.success('Payment completed successfully!');
      onPaymentSuccess();
      onClose();
    } catch (error) {
      await updatePaymentStatus(paymentId, 'failed');
      toast.error('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { value: 'upi', label: 'UPI', icon: Smartphone },
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'netbanking', label: 'Net Banking', icon: Building }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Rent</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  disabled={isProcessing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <div key={method.value}>
                      <Button
                        variant={paymentMethod === method.value ? "default" : "outline"}
                        className="w-full justify-start h-12"
                        onClick={() => setPaymentMethod(method.value)}
                        disabled={isProcessing}
                      >
                        <IconComponent className="h-5 w-5 mr-3" />
                        {method.label}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span>₹{amount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handlePayment}
              disabled={isProcessing || !paymentMethod}
            >
              {isProcessing ? 'Processing...' : `Pay ₹${amount}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
