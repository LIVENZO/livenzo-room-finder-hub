import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Smartphone, ArrowRight, Zap, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PaymentMethodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSelectRazorpay: () => void;
  onSelectUpiDirect: () => void;
}

export const PaymentMethodSelector = ({ 
  isOpen, 
  onClose, 
  amount, 
  onSelectRazorpay, 
  onSelectUpiDirect 
}: PaymentMethodSelectorProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            Select how you want to pay your rent
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
            {/* Razorpay Option */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
              onClick={onSelectRazorpay}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Pay with Razorpay</h3>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          <Zap className="h-3 w-3 mr-1" />
                          Instant
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking</p>
                      <p className="text-xs text-muted-foreground">Automatic verification & receipt</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* UPI Direct Option */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-200"
              onClick={onSelectUpiDirect}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Smartphone className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">UPI Direct Payment</h3>
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Manual
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Pay directly to owner's UPI</p>
                      <p className="text-xs text-muted-foreground">No processing fees • Manual verification</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Razorpay:</strong> Instant processing with small convenience fee</p>
            <p><strong>UPI Direct:</strong> No fees, owner verification required (1-2 days)</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};