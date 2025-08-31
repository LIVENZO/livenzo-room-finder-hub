import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, User, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string;
  payment_method: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  owner_id?: string;
  renter_id?: string;
  relationship_id?: string;
}


export const PaymentHistoryList = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isOwner } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user, isOwner]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (isOwner) {
        query = query.eq('owner_id', user.id);
      } else {
        query = query.eq('renter_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payments:', error);
        toast.error('Failed to load payment history');
        return;
      }

      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Payments Found</h3>
          <p className="text-muted-foreground text-center">
            {isOwner 
              ? "You haven't received any payments yet." 
              : "You haven't made any payments yet."
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {isOwner ? "Received Payments" : "Payment History"}
        </CardTitle>
      </CardHeader>

      {payments.map((payment) => (
        <Card key={payment.id}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    ₹{Number(payment.amount).toLocaleString()}
                  </span>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(payment.payment_date), 'PPp')}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {isOwner ? "From Renter" : "To Owner"}
                </div>

                {payment.razorpay_payment_id && (
                  <div className="text-xs text-muted-foreground">
                    Payment ID: {payment.razorpay_payment_id}
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <div>Method: {payment.payment_method || 'Razorpay'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};