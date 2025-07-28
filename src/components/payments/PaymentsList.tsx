import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PaymentsListProps {
  payments: any[];
}

export const PaymentsList = ({ payments }: PaymentsListProps) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payments found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <p className="font-medium">₹{payment.amount}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(payment.payment_date), "MMM dd, yyyy 'at' h:mm a")}
            </p>
            {payment.razorpay_payment_id && (
              <p className="text-xs text-muted-foreground">
                Transaction ID: {payment.razorpay_payment_id}
              </p>
            )}
          </div>
          <div className="text-right space-y-1">
            <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
              {payment.status}
            </Badge>
            {payment.payment_method && (
              <p className="text-xs text-muted-foreground">
                {payment.payment_method.toUpperCase()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};