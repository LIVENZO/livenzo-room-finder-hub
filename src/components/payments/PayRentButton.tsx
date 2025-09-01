import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { RazorpayPaymentModal } from "./RazorpayPaymentModal";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePaymentSuccess = (paymentDetails: any) => {
    setIsModalOpen(false);
    setIsLoading(false);
    toast.success(`Payment of ₹${amount} completed successfully!`);
    
    // Refresh the page to show updated payment status
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handlePaymentFailure = (error: string) => {
    setIsModalOpen(false);
    setIsLoading(false);
    toast.error(`Payment failed: ${error}`);
  };

  const handlePayClick = () => {
    if (disabled) return;
    setIsLoading(true);
    setIsModalOpen(true);
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

      <RazorpayPaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsLoading(false);
        }}
        amount={amount}
        relationshipId={relationshipId}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />
    </>
  );
};