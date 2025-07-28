import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PaymentHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentHistory = ({ isOpen, onClose }: PaymentHistoryProps) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchPayments();
    }
  }, [isOpen, user]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('renter_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            View all your previous rent payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment history found
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">₹{payment.amount}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                  </p>
                  {payment.razorpay_payment_id && (
                    <p className="text-xs text-muted-foreground">
                      ID: {payment.razorpay_payment_id}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                    {payment.status}
                  </Badge>
                  {payment.payment_method && (
                    <p className="text-xs text-muted-foreground">
                      {payment.payment_method.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};