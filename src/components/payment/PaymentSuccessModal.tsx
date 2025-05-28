
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Calendar, CreditCard, Hash } from 'lucide-react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  transactionId: string;
  paymentDate: string;
  paymentMethod: string;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  amount,
  transactionId,
  paymentDate,
  paymentMethod
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Payment Successful!</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-center">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* Payment Details Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-2xl font-bold text-green-600">₹{amount}</div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                  </div>
                  <span className="font-medium">
                    {new Date(paymentDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span>Method</span>
                  </div>
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Hash className="h-4 w-4" />
                    <span>Transaction ID</span>
                  </div>
                  <span className="font-medium text-xs">{transactionId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          <div className="text-gray-600">
            Your rent payment has been processed successfully. You will receive a confirmation shortly.
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessModal;
