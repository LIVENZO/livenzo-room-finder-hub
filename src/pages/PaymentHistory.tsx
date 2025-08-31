import Layout from "@/components/Layout";
import { PaymentHistoryList } from "@/components/payments/PaymentHistoryList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { useAuth } from "@/context/auth";

const PaymentHistory = () => {
  const { isOwner } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              {isOwner ? "Payment History - Received" : "Payment History - Made"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentHistoryList />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentHistory;