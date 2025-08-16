import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, RefreshCw, MessageCircle } from "lucide-react";

interface PaymentFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorMessage?: string;
  amount: number;
}

export const PaymentFailureModal = ({ 
  isOpen, 
  onClose, 
  onRetry, 
  errorMessage, 
  amount 
}: PaymentFailureModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-red-800">Payment Failed ❌</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div>
                  <p className="text-sm text-red-700">Attempted Amount</p>
                  <p className="text-2xl font-bold text-red-800">₹{amount.toLocaleString()}</p>
                </div>
                
                {errorMessage && (
                  <div className="p-3 bg-white rounded-lg border border-red-200">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Common reasons for payment failure:</p>
            <ul className="space-y-1 ml-4">
              <li>• Insufficient balance in your account</li>
              <li>• Network connectivity issues</li>
              <li>• Bank server temporarily unavailable</li>
              <li>• Transaction limit exceeded</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={onRetry}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <MessageCircle className="h-3 w-3" />
            <span>Need help? Contact support for assistance</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};