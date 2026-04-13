import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";

interface PaymentBreakdown {
  rent: number;
  securityDeposit: number;
  maintenance: number;
}

interface PaymentBreakdownQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: PaymentBreakdown;
  upiId: string;
  ownerName: string;
  renterName: string;
}

const PaymentBreakdownQRModal = ({
  isOpen,
  onClose,
  breakdown,
  upiId,
  ownerName,
  renterName,
}: PaymentBreakdownQRModalProps) => {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const totalAmount = breakdown.rent + breakdown.securityDeposit + breakdown.maintenance;

  useEffect(() => {
    if (!isOpen || !totalAmount || !upiId) return;
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(ownerName)}&am=${totalAmount}&cu=INR`;
    QRCode.toDataURL(upiUri, { width: 280, margin: 2 })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [isOpen, totalAmount, upiId, ownerName]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm mx-4 rounded-2xl p-0 overflow-hidden">
        {/* Success header */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">Payment Details Saved!</DialogTitle>
          </DialogHeader>
          <p className="text-emerald-100 text-sm mt-1">for {renterName}</p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Breakdown */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-medium text-foreground">₹{breakdown.rent.toLocaleString()}</span>
            </div>
            {breakdown.securityDeposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Security Deposit</span>
                <span className="font-medium text-foreground">₹{breakdown.securityDeposit.toLocaleString()}</span>
              </div>
            )}
            {breakdown.maintenance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Maintenance</span>
                <span className="font-medium text-foreground">₹{breakdown.maintenance.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total Amount</span>
              <span className="text-lg font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* QR Code */}
          {qrDataUrl && upiId && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground text-center">
                Scan to pay via UPI
              </p>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-border">
                <img src={qrDataUrl} alt="UPI QR Code" className="w-52 h-52" />
              </div>
              <p className="text-xs font-medium text-muted-foreground select-all bg-muted px-3 py-1.5 rounded-lg">
                {upiId}
              </p>
            </div>
          )}

          {!upiId && (
            <div className="text-center py-3">
              <p className="text-sm text-amber-600 font-medium">
                ⚠️ UPI ID not set. Please configure your payment details first.
              </p>
            </div>
          )}

          <Button variant="outline" onClick={onClose} className="w-full h-11 rounded-xl">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentBreakdownQRModal;
