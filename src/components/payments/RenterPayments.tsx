import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, CreditCard, History } from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { PaymentHistory } from "./PaymentHistory";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RentStatus {
  id: string;
  current_amount: number;
  due_date: string;
  status: string;
  relationship_id: string;
}

export const RenterPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rentStatus, setRentStatus] = useState<RentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRentStatus();
    }
  }, [user]);

  const fetchRentStatus = async () => {
    try {
      // Get active relationship first
      const { data: relationships, error: relationshipError } = await supabase
        .from('relationships')
        .select('id')
        .eq('renter_id', user?.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (relationshipError) throw relationshipError;

      if (relationships && relationships.length > 0) {
        // Get rent status for the active relationship
        const { data, error } = await supabase
          .from('rent_status')
          .select('*')
          .eq('relationship_id', relationships[0].id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setRentStatus(data);
      }
    } catch (error) {
      console.error('Error fetching rent status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rent status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = rentStatus && new Date(rentStatus.due_date) < new Date() && rentStatus.status !== 'paid';

  if (loading) {
    return <div className="flex justify-center items-center h-48">Loading...</div>;
  }

  if (!rentStatus) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No active rental found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button
          variant="outline"
          onClick={() => setShowHistory(true)}
        >
          <History className="mr-2 h-4 w-4" />
          Payment History
        </Button>
      </div>

      {/* Current Rent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Rent Status
          </CardTitle>
          <CardDescription>
            Your current rent payment information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount Due</label>
              <p className="text-2xl font-bold">₹{rentStatus.current_amount}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Due Date</label>
              <p className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(rentStatus.due_date), "MMM dd, yyyy")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={rentStatus.status === 'paid' ? 'default' : isOverdue ? 'destructive' : 'secondary'}>
                  {rentStatus.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                </Badge>
              </div>
            </div>
          </div>

          {isOverdue && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">
                Your rent is overdue. Please pay as soon as possible.
              </span>
            </div>
          )}

          {rentStatus.status !== 'paid' && (
            <Button 
              onClick={() => setShowPaymentModal(true)}
              className="w-full"
              size="lg"
            >
              Pay Rent Now
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={rentStatus.current_amount}
          relationshipId={rentStatus.relationship_id}
          onSuccess={() => {
            fetchRentStatus();
            setShowPaymentModal(false);
          }}
        />
      )}

      {/* Payment History Modal */}
      {showHistory && (
        <PaymentHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};