import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, CreditCard, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  transaction_id?: string;
}

export const PaymentHistoryList = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payments:", error);
        return;
      }

      setPayments(data || []);
      setLoading(false);
    };

    fetchPayments();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Success ✅</Badge>;
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800">Pending ⏳</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed ❌</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "razorpay":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "upi_manual":
        return <Smartphone className="h-4 w-4 text-green-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading payments...</div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No payments found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getMethodIcon(payment.payment_method)}
                <div>
                  <div className="font-medium">₹{payment.amount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    {payment.payment_method === "razorpay" ? "Razorpay" : "UPI Manual"} •{" "}
                    {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                  </div>
                  {payment.transaction_id && (
                    <div className="text-xs text-muted-foreground">
                      ID: {payment.transaction_id}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(payment.payment_status)}
                {getStatusBadge(payment.payment_status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};