import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { PaymentHistoryList } from "@/components/payments/PaymentHistoryList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";

const PaymentHistory = () => {
  const { isOwner, user } = useAuth();
  const [hasRelationship, setHasRelationship] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || isOwner) return;

    const checkRelationship = async () => {
      const { data } = await supabase
        .from("relationships")
        .select("id")
        .eq("renter_id", user.id)
        .eq("status", "accepted")
        .neq("archived", true)
        .maybeSingle();

      setHasRelationship(!!data);
    };

    checkRelationship();
  }, [user, isOwner]);

  const renderEmptyState = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10 px-6 text-center">
        <h3 className="text-lg font-semibold mb-3">No Active Connection</h3>
        <p className="text-muted-foreground max-w-md">
          You are not connected to any hostel owner yet. Connect with an owner to view and pay your rent.
        </p>
      </CardContent>
    </Card>
  );

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
            {!isOwner && hasRelationship === false ? renderEmptyState() : <PaymentHistoryList />}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentHistory;