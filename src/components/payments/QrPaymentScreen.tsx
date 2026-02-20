import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

interface QrPaymentScreenProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  returnPath?: string;
}

const UPI_ID = "7488698970@ybl";

export const QrPaymentScreen = ({ isOpen, onClose, amount, returnPath }: QrPaymentScreenProps) => {
  const navigate = useNavigate();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !amount) return;
    const upiUri = `upi://pay?pa=${UPI_ID}&pn=Livenzo&am=${amount}&cu=INR`;
    QRCode.toDataURL(upiUri, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [isOpen, amount]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Booking Confirmation Fee</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="text-center">
            <span className="text-3xl font-bold text-foreground">₹{amount.toLocaleString()}</span>
            <p className="text-xs text-muted-foreground mt-1">25% of first month rent</p>
          </div>

          {qrDataUrl && (
            <img src={qrDataUrl} alt="UPI QR Code" className="w-56 h-56" />
          )}

          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Scan the QR code or pay using the UPI ID below.
          </p>

          <p className="text-base font-medium text-foreground select-all">{UPI_ID}</p>

          <Button variant="outline" onClick={() => {
            onClose();
            if (returnPath) {
              navigate(returnPath, { replace: true });
            }
          }} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
