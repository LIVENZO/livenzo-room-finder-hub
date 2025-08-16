import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Download, Home } from "lucide-react";
import { format } from "date-fns";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetails: {
    amount: number;
    transactionId: string;
    date: string;
    propertyName?: string;
  };
  onDownloadReceipt: () => void;
  onGoHome: () => void;
}

export const PaymentSuccessModal = ({ 
  isOpen, 
  onClose, 
  paymentDetails, 
  onDownloadReceipt,
  onGoHome 
}: PaymentSuccessModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-800">Payment Successful! 🎉</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div>
                  <p className="text-sm text-green-700">Amount Paid</p>
                  <p className="text-3xl font-bold text-green-800">₹{paymentDetails.amount.toLocaleString()}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-mono text-xs">{paymentDetails.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span>{format(new Date(paymentDetails.date), "MMM dd, yyyy 'at' h:mm a")}</span>
                  </div>
                  {paymentDetails.propertyName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property:</span>
                      <span>{paymentDetails.propertyName}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={onDownloadReceipt}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            
            <Button 
              onClick={onGoHome}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your payment has been processed successfully. You'll receive a confirmation email shortly.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};