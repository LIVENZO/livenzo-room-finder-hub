import { OwnerPaymentsList } from "./OwnerPaymentsList";
import { OwnerUpiSettings } from "./OwnerUpiSettings";

export const OwnerPayments = () => {
  return (
    <div className="space-y-6">
      {/* UPI Payment Settings */}
      <OwnerUpiSettings />
      
      {/* Payment History */}
      <OwnerPaymentsList />
    </div>
  );
};