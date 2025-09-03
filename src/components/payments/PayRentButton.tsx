import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { RazorpayPaymentModal } from "./RazorpayPaymentModal";
import { UpiPaymentModal } from "./UpiPaymentModal";
import { toast } from "sonner";

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
  const [isMethodSelectorOpen, setIsMethodSelectorOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fixed UPI ID for Livenzo
  const LIVENZO_UPI_ID = "7488698970@ybl";

  const handlePaymentSuccess = (paymentDetails: any) => {
    setIsRazorpayModalOpen(false);
    setIsUpiModalOpen(false);
    setIsLoading(false);
    toast.success(`Payment of ₹${amount} completed successfully!`);
    
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

  const handlePayClick = () => {
    if (disabled) return;
    setIsLoading(true);
    setIsMethodSelectorOpen(true);
    setIsLoading(false);
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

      <PaymentMethodSelector
        isOpen={isMethodSelectorOpen}
        onClose={() => setIsMethodSelectorOpen(false)}
        amount={amount}
        onSelectRazorpay={handleSelectRazorpay}
        onSelectUpiDirect={handleSelectUpiDirect}
      />

      <RazorpayPaymentModal
        isOpen={isRazorpayModalOpen}
        onClose={() => {
          setIsRazorpayModalOpen(false);
          setIsLoading(false);
        }}
        amount={amount}
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
        amount={amount}
        relationshipId={relationshipId || ""}
        ownerUpiId={LIVENZO_UPI_ID}
        ownerName="Livenzo"
        onSuccess={() => handlePaymentSuccess({})}
      />
    </>
  );
};