import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, CreditCard, Smartphone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { format } from "date-fns";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  transaction_id?: string;
  renter_id: string;
  user_profiles?: {
    full_name?: string;
  };
}

export const OwnerPaymentsList = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          payment_method,
          payment_status,
          payment_date,
          transaction_id,
          renter_id
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payments:", error);
        return;
      }

      // Get renter details for each payment
      const enrichedPayments = await Promise.all(
        (data || []).map(async (payment) => {
          const { data: renterData } = await supabase
            .from("user_profiles")
            .select("full_name")
            .eq("id", payment.renter_id)
            .single();

          return {
            ...payment,
            user_profiles: renterData
          };
        })
      );

      setPayments(enrichedPayments);
      setLoading(false);
    };

    fetchPayments();
  }, [user]);

  const handleVerifyPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from("payments")
      .update({ payment_status: "paid" })
      .eq("id", paymentId);

    if (error) {
      toast.error("Failed to verify payment");
      return;
    }

    toast.success("Payment verified successfully");
    setPayments(prev => 
      prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, payment_status: "paid" }
          : payment
      )
    );
  };

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
          <CardTitle>Rent Payments</CardTitle>
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
          <CardTitle>Rent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No payments received yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rent Payments</CardTitle>
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
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {payment.user_profiles?.full_name || "Unknown Renter"} •{" "}
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
              <div className="flex items-center gap-3">
                {getStatusIcon(payment.payment_status)}
                {getStatusBadge(payment.payment_status)}
                {payment.payment_method === "upi_manual" && payment.payment_status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleVerifyPayment(payment.id)}
                    className="ml-2"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};