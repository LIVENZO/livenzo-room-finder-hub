import { QrPaymentScreen } from "./QrPaymentScreen";

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  electricBillAmount?: number;
  relationshipId?: string;
  rentId?: string;
  onSuccess: (paymentDetails: any) => void;
  onFailure: (error: string) => void;
}

export const RazorpayPaymentModal = ({ 
  isOpen, 
  onClose, 
  amount,
}: RazorpayPaymentModalProps) => {
  return <QrPaymentScreen isOpen={isOpen} onClose={onClose} amount={amount} />;
};
