import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, QrCode, Upload, Loader2, Check, Download } from "lucide-react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import QRCode from "qrcode";

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  relationshipId: string;
  ownerUpiId: string;
  ownerName: string;
  onSuccess: () => void;
}

export const UpiPaymentModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  relationshipId, 
  ownerUpiId, 
  ownerName,
  onSuccess 
}: UpiPaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Generate QR code when modal opens
  const generateQRCode = async () => {
    try {
      const upiUrl = `upi://pay?pa=${ownerUpiId}&pn=${encodeURIComponent(ownerName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Rent Payment')}`;
      const qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  useEffect(() => {
    if (isOpen && !qrCodeDataUrl) {
      generateQRCode();
    }
  }, [isOpen, ownerUpiId, amount, ownerName]);

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(ownerUpiId);
      setCopied(true);
      toast({ description: "UPI ID copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ description: "Failed to copy UPI ID", variant: "destructive" });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ description: "File size should be less than 5MB", variant: "destructive" });
        return;
      }
      setProofFile(file);
    }
  };

  const handleDownloadQRCode = async () => {
    try {
      if (!qrCodeDataUrl) {
        toast({ description: "QR code not available for download", variant: "destructive" });
        return;
      }

      // Create a temporary link to download the QR code
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `livenzo-payment-qr-${amount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ description: "QR code downloaded successfully!" });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({ description: "Failed to download QR code", variant: "destructive" });
    }
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      toast({ description: "Please enter the transaction ID", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let proofImageUrl = null;
      let proofFileName = null;

      // Upload proof image if provided
      if (proofFile) {
        const fileName = `${user?.id}-manual-payment-${Date.now()}-${proofFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, proofFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName);

        proofImageUrl = urlData.publicUrl;
        proofFileName = fileName;
      }

      // Get relationship details for owner_id
      const { data: relationship, error: relError } = await supabase
        .from('relationships')
        .select('owner_id')
        .eq('id', relationshipId)
        .single();

      if (relError) throw relError;

      // Also create a record in the main payments table
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          renter_id: user?.id,
          owner_id: relationship.owner_id,
          relationship_id: relationshipId,
          amount: amount,
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'upi_manual',
          transaction_id: transactionId.trim(),
          payment_date: new Date().toISOString()
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError;
      }

      // Submit manual payment record for owner verification
      const { error: insertError } = await supabase
        .from('manual_payments')
        .insert({
          renter_id: user?.id,
          owner_id: relationship.owner_id,
          relationship_id: relationshipId,
          amount: amount,
          transaction_id: transactionId.trim(),
          proof_image_url: proofImageUrl,
          proof_file_name: proofFileName,
          notes: notes.trim() || null,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "Payment Submitted",
        description: "Your payment proof has been submitted for verification",
      });

      onSuccess();
      onClose();
      
      // Reset form
      setTransactionId("");
      setProofFile(null);
      setNotes("");
    } catch (error) {
      console.error('Error submitting manual payment:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit payment proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateUpiUrl = () => {
    const upiUrl = `upi://pay?pa=${ownerUpiId}&pn=${encodeURIComponent(ownerName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Rent Payment')}`;
    return upiUrl;
  };

  const handlePayWithUpi = async () => {
    const upiUrl = generateUpiUrl();
    
    try {
      if (Capacitor.isNativePlatform()) {
        // Use window.open with _system target to trigger native intent chooser
        // This works better than App.openUrl for UPI deep links on Android
        const opened = window.open(upiUrl, '_system');
        
        if (opened) {
          // Show success message that UPI app should open
          toast({
            title: "Opening UPI App",
            description: "UPI app should open now. Complete the payment and return to submit proof.",
          });
        } else {
          throw new Error('Failed to open UPI app');
        }
      } else {
        // On web platforms, try to open UPI link
        window.location.href = upiUrl;
      }
    } catch (error) {
      console.error('Error opening UPI app:', error);
      
      if (Capacitor.isNativePlatform()) {
        toast({
          title: "No UPI App Found",
          description: "No UPI app installed. Please install Google Pay, PhonePe, Paytm, or BHIM to continue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "UPI Not Supported",
          description: "UPI payments work best on mobile. Please use a mobile device or try Razorpay.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Pay via UPI Direct</DialogTitle>
          <DialogDescription>
            Pay directly to your owner using any UPI app
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-3xl font-bold">₹{amount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">to {ownerName}</p>
              </div>
            </CardContent>
          </Card>

          {/* UPI ID Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium">UPI ID</p>
                <p className="text-sm text-muted-foreground truncate">{ownerUpiId}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyUpiId}
                className="ml-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* QR Code Section */}
            {qrCodeDataUrl && (
              <div className="text-center p-3 border rounded-lg space-y-3">
                <p className="font-medium">Scan QR Code</p>
                <img 
                  src={qrCodeDataUrl} 
                  alt="UPI QR Code" 
                  className="mx-auto w-32 h-32 object-contain border rounded"
                />
                
                {/* Download QR Code Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQRCode}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            )}

            {/* Pay with UPI App */}
            <Button 
              onClick={handlePayWithUpi}
              className="w-full"
              variant="outline"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Open UPI App
            </Button>
          </div>

          {/* Payment Proof Section */}
          <div className="space-y-3 pt-4 border-t">
            <p className="font-medium">After Payment - Submit Proof</p>
            
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID *</Label>
              <Input
                id="transactionId"
                placeholder="Enter UPI transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">Payment Screenshot (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="proof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('proof')?.click()}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {proofFile ? proofFile.name : "Upload Screenshot"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about the payment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

        </div>
        
        <div className="flex-shrink-0 space-y-3 border-t pt-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPayment} 
              disabled={loading || !transactionId.trim()}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Proof
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your payment will be marked as "Pending" until verified by your owner. No processing fees apply.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};