import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Download, TrendingUp, Users } from "lucide-react";
import { PaymentsList } from "./PaymentsList";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PaymentStats {
  totalReceived: number;
  thisMonth: number;
  pendingAmount: number;
  totalRenters: number;
}

export const OwnerPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalReceived: 0,
    thisMonth: 0,
    pendingAmount: 0,
    totalRenters: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchStats();
    }
  }, [user, selectedMonth]);

  const fetchPayments = async () => {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          relationships!inner(
            id,
            renter_id,
            owner_id
          )
        `)
        .eq('relationships.owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (selectedMonth !== 'all') {
        const year = new Date().getFullYear();
        const month = parseInt(selectedMonth);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        query = query
          .gte('payment_date', startDate.toISOString())
          .lte('payment_date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get all payments for this owner
      const { data: allPayments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_date,
          status,
          relationships!inner(owner_id)
        `)
        .eq('relationships.owner_id', user?.id);

      if (paymentsError) throw paymentsError;

      // Get rent statuses for pending amounts
      const { data: rentStatuses, error: rentError } = await supabase
        .from('rent_status')
        .select(`
          current_amount,
          status,
          relationship_id,
          relationships!inner(owner_id)
        `)
        .eq('relationships.owner_id', user?.id)
        .neq('status', 'paid');

      if (rentError) throw rentError;

      // Get total renters count
      const { data: relationships, error: relationshipsError } = await supabase
        .from('relationships')
        .select('id')
        .eq('owner_id', user?.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (relationshipsError) throw relationshipsError;

      // Calculate stats
      const totalReceived = allPayments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = allPayments
        ?.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return p.status === 'paid' && 
                 paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const pendingAmount = rentStatuses
        ?.reduce((sum, rs) => sum + Number(rs.current_amount), 0) || 0;

      setStats({
        totalReceived,
        thisMonth,
        pendingAmount,
        totalRenters: relationships?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const exportPayments = () => {
    if (payments.length === 0) {
      toast({
        title: "No Data",
        description: "No payments to export",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Date', 'Amount', 'Status', 'Payment Method', 'Transaction ID'].join(','),
      ...payments.map(payment => [
        format(new Date(payment.payment_date), 'yyyy-MM-dd'),
        payment.amount,
        payment.status,
        payment.payment_method || 'N/A',
        payment.razorpay_payment_id || payment.transaction_id || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Payments report has been downloaded",
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-48">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <Button onClick={exportPayments} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold">₹{stats.totalReceived.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">₹{stats.thisMonth.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">₹{stats.pendingAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Renters</p>
                <p className="text-2xl font-bold">{stats.totalRenters}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and manage all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="1">January</SelectItem>
                <SelectItem value="2">February</SelectItem>
                <SelectItem value="3">March</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">May</SelectItem>
                <SelectItem value="6">June</SelectItem>
                <SelectItem value="7">July</SelectItem>
                <SelectItem value="8">August</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PaymentsList payments={payments} />
        </CardContent>
      </Card>
    </div>
  );
};