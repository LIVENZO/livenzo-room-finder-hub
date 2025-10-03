import { useState, useRef } from "react";
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
  const [flowStep, setFlowStep] = useState<'idle'|'meter'|'bill'|'method'|'razorpay'|'upi'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [finalAmount, setFinalAmount] = useState(amount);
  const [ownerId, setOwnerId] = useState<string>("");
  const { user } = useAuth();
  const advancingRef = useRef(false);

  // Fixed UPI ID for Livenzo
  const LIVENZO_UPI_ID = "7488698970@ybl";

  const handlePaymentSuccess = (paymentDetails: any) => {
    setFlowStep('idle');
    setIsLoading(false);
    toast.success(`Payment of ₹${finalAmount} completed successfully!`);
    
    // Refresh the page to show updated payment status
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handlePaymentFailure = (error: string) => {
    setFlowStep('idle');
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
      
      setFlowStep('meter');
    } catch (error) {
      console.error('Error fetching relationship:', error);
      toast.error('Failed to load payment information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeterPhotoComplete = () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setFlowStep('bill');
  };

  const handleElectricityBillComplete = (totalAmount: number) => {
    setFinalAmount(totalAmount);
    setFlowStep('upi'); // Skip payment method selector, go directly to UPI
    advancingRef.current = false;
  };

  const handleSelectRazorpay = () => {
    setFlowStep('razorpay');
  };

  const handleSelectUpiDirect = () => {
    setFlowStep('upi');
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
        isOpen={flowStep === 'meter'}
        onClose={() => { if (!advancingRef.current) setFlowStep('idle'); }}
        onContinue={handleMeterPhotoComplete}
        relationshipId={relationshipId || ""}
        ownerId={ownerId}
      />

      <ElectricityBillModal
        isOpen={flowStep === 'bill'}
        onClose={() => { setFlowStep('idle'); advancingRef.current = false; }}
        onContinue={handleElectricityBillComplete}
        rentAmount={amount}
      />

      <PaymentMethodSelector
        isOpen={flowStep === 'method'}
        onClose={() => setFlowStep('idle')}
        amount={finalAmount}
        onSelectRazorpay={handleSelectRazorpay}
        onSelectUpiDirect={handleSelectUpiDirect}
      />

      <RazorpayPaymentModal
        isOpen={flowStep === 'razorpay'}
        onClose={() => {
          setFlowStep('idle');
          setIsLoading(false);
        }}
        amount={finalAmount}
        relationshipId={relationshipId}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />

      <UpiPaymentModal
        isOpen={flowStep === 'upi'}
        onClose={() => {
          setFlowStep('idle');
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