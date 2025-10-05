import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Upload, Loader2, Check, Smartphone } from "lucide-react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  electricBillAmount?: number;
  relationshipId: string;
  ownerUpiId: string;
  ownerName: string;
  onSuccess: () => void;
}

export const UpiPaymentModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  electricBillAmount = 0,
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
  const [ownerUpiPhone, setOwnerUpiPhone] = useState<string>("");
  const [ownerId, setOwnerId] = useState<string>("");

  // Fetch owner's UPI phone number
  useEffect(() => {
    const fetchOwnerDetails = async () => {
      try {
        // Get owner_id from relationship
        const { data: relationship, error: relError } = await supabase
          .from('relationships')
          .select('owner_id')
          .eq('id', relationshipId)
          .single();

        if (relError) throw relError;
        setOwnerId(relationship.owner_id);

        // Fetch owner's UPI phone number
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('upi_phone_number')
          .eq('id', relationship.owner_id)
          .single();

        if (profileError) throw profileError;
        setOwnerUpiPhone(profile.upi_phone_number || "Not available");
      } catch (error) {
        console.error('Error fetching owner details:', error);
        toast({ description: "Failed to load owner payment details", variant: "destructive" });
      }
    };

    if (isOpen) {
      fetchOwnerDetails();
    }
  }, [isOpen, relationshipId]);

  const handleCopyUpiPhone = async () => {
    try {
      await navigator.clipboard.writeText(ownerUpiPhone);
      setCopied(true);
      toast({ description: "UPI Phone Number copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ description: "Failed to copy UPI Phone Number", variant: "destructive" });
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

      // Get current billing month
      const billingMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM

      // Check if payment record exists for this billing month
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('renter_id', user?.id)
        .eq('owner_id', ownerId)
        .eq('relationship_id', relationshipId)
        .eq('billing_month', billingMonth)
        .maybeSingle();

      if (existingPayment) {
        // Update existing payment record
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            amount: amount,
            electric_bill_amount: electricBillAmount > 0 ? electricBillAmount : null,
            transaction_id: transactionId.trim(),
            payment_date: new Date().toISOString(),
            payment_method: 'upi_manual',
            payment_status: 'pending',
            status: 'pending'
          })
          .eq('id', existingPayment.id);

        if (updateError) {
          console.error('Error updating payment record:', updateError);
          throw updateError;
        }
      } else {
        // Create a new payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            renter_id: user?.id,
            owner_id: ownerId,
            relationship_id: relationshipId,
            amount: amount,
            electric_bill_amount: electricBillAmount > 0 ? electricBillAmount : null,
            billing_month: billingMonth,
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
      }

      // Submit manual payment record for owner verification
      const { error: insertError } = await supabase
        .from('manual_payments')
        .insert({
          renter_id: user?.id,
          owner_id: ownerId,
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

  const handlePayWithUpi = async () => {
    try {
      // Simple UPI URL without pre-filled data - just opens the UPI app
      const upiUrl = 'upi://';
      
      if (Capacitor.isNativePlatform()) {
        // Use window.open to trigger native UPI app chooser
        const opened = window.open(upiUrl, '_system');
        
        if (opened) {
          toast({
            title: "Opening UPI App",
            description: "Complete the payment and return to submit proof with transaction ID.",
          });
        } else {
          throw new Error('Failed to open UPI app');
        }
      } else {
        // On web platforms, just show a message
        toast({
          title: "UPI Available on Mobile",
          description: "Please use a mobile device to open UPI apps directly.",
        });
      }
    } catch (error) {
      console.error('Error opening UPI app:', error);
      
      if (Capacitor.isNativePlatform()) {
        toast({
          title: "No UPI App Found",
          description: "Please install Google Pay, PhonePe, Paytm, or BHIM to continue.",
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

          {/* UPI Phone Number Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-medium">Owner's UPI Phone Number</p>
                <p className="text-sm text-muted-foreground truncate">{ownerUpiPhone}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyUpiPhone}
                className="ml-2"
                disabled={!ownerUpiPhone || ownerUpiPhone === "Not available"}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Pay via UPI App Button */}
            <Button 
              onClick={handlePayWithUpi}
              className="w-full"
              size="lg"
            >
              <Smartphone className="mr-2 h-5 w-5" />
              Pay via UPI App
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