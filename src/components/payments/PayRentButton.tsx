import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { RazorpayPaymentModal } from "./RazorpayPaymentModal";
import { UpiPaymentModal } from "./UpiPaymentModal";
import { MeterPhotoUploadModal } from "./MeterPhotoUploadModal";
import { ElectricityBillModal } from "./ElectricityBillModal";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";

interface PayRentButtonProps {
  amount: number;
  relationshipId?: string;
  disabled?: boolean;
  className?: string;
}

export const PayRentButton = ({ 
  amount, 
  relationshipId, 
  disabled = false,
  className = ""
}: PayRentButtonProps) => {
  const [isMeterPhotoModalOpen, setIsMeterPhotoModalOpen] = useState(false);
  const [isElectricityBillModalOpen, setIsElectricityBillModalOpen] = useState(false);
  const [isMethodSelectorOpen, setIsMethodSelectorOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [finalAmount, setFinalAmount] = useState(amount);
  const [ownerId, setOwnerId] = useState<string>("");
  const { user } = useAuth();

  // Fixed UPI ID for Livenzo
  const LIVENZO_UPI_ID = "7488698970@ybl";

  const handlePaymentSuccess = (paymentDetails: any) => {
    setIsRazorpayModalOpen(false);
    setIsUpiModalOpen(false);
    setIsLoading(false);
    toast.success(`Payment of ₹${finalAmount} completed successfully!`);
    
    // Refresh the page to show updated payment status
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handlePaymentFailure = (error: string) => {
    setIsRazorpayModalOpen(false);
    setIsUpiModalOpen(false);
    setIsLoading(false);
    toast.error(`Payment failed: ${error}`);
  };

  const handlePayClick = async () => {
    if (disabled) return;
    setIsLoading(true);
    
    try {
      // Get owner ID from relationship
      if (relationshipId && !ownerId) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: relationship } = await supabase
          .from('relationships')
          .select('owner_id')
          .eq('id', relationshipId)
          .maybeSingle();
        
        if (relationship?.owner_id) {
          setOwnerId(relationship.owner_id);
        }
      }
      
      setIsMeterPhotoModalOpen(true);
    } catch (error) {
      console.error('Error fetching relationship:', error);
      toast.error('Failed to load payment information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeterPhotoComplete = () => {
    setIsMeterPhotoModalOpen(false);
    setIsElectricityBillModalOpen(true);
  };

  const handleElectricityBillComplete = (totalAmount: number) => {
    setFinalAmount(totalAmount);
    setIsElectricityBillModalOpen(false);
    setIsMethodSelectorOpen(true);
  };

  const handleSelectRazorpay = () => {
    setIsMethodSelectorOpen(false);
    setIsRazorpayModalOpen(true);
  };

  const handleSelectUpiDirect = () => {
    setIsMethodSelectorOpen(false);
    setIsUpiModalOpen(true);
  };

  return (
    <>
      <Button
        onClick={handlePayClick}
        disabled={disabled || isLoading}
        className={`${className}`}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Rent ₹{amount.toLocaleString()}
          </>
        )}
      </Button>

      <MeterPhotoUploadModal
        isOpen={isMeterPhotoModalOpen}
        onClose={() => setIsMeterPhotoModalOpen(false)}
        onContinue={handleMeterPhotoComplete}
        relationshipId={relationshipId || ""}
        ownerId={ownerId}
      />

      <ElectricityBillModal
        isOpen={isElectricityBillModalOpen}
        onClose={() => setIsElectricityBillModalOpen(false)}
        onContinue={handleElectricityBillComplete}
        rentAmount={amount}
      />

      <PaymentMethodSelector
        isOpen={isMethodSelectorOpen}
        onClose={() => setIsMethodSelectorOpen(false)}
        amount={finalAmount}
        onSelectRazorpay={handleSelectRazorpay}
        onSelectUpiDirect={handleSelectUpiDirect}
      />

      <RazorpayPaymentModal
        isOpen={isRazorpayModalOpen}
        onClose={() => {
          setIsRazorpayModalOpen(false);
          setIsLoading(false);
        }}
        amount={finalAmount}
        relationshipId={relationshipId}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />

      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => {
          setIsUpiModalOpen(false);
          setIsLoading(false);
        }}
        amount={finalAmount}
        relationshipId={relationshipId || ""}
        ownerUpiId={LIVENZO_UPI_ID}
        ownerName="Livenzo"
        onSuccess={() => handlePaymentSuccess({})}
      />
    </>
  );
};