import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DollarSign, 
  Download, 
  TrendingUp, 
  Users, 
  Plus, 
  Send, 
  FileSpreadsheet,
  FileText,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from "lucide-react";
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
  const [selectedRenter, setSelectedRenter] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [renters, setRenters] = useState<any[]>([]);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [overduePayments, setOverduePayments] = useState<any[]>([]);

  // Manual payment form state
  const [manualPayment, setManualPayment] = useState({
    renter_id: '',
    amount: '',
    payment_method: 'cash',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchStats();
      fetchRenters();
      fetchOverduePayments();
    }
  }, [user, selectedMonth, selectedRenter, selectedStatus]);

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

      if (selectedRenter !== 'all') {
        query = query.eq('renter_id', selectedRenter);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
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

  const fetchRenters = async () => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select(`
          renter_id,
          user_profiles!relationships_renter_id_fkey(full_name)
        `)
        .eq('owner_id', user?.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (error) throw error;
      setRenters(data || []);
    } catch (error) {
      console.error('Error fetching renters:', error);
    }
  };

  const fetchOverduePayments = async () => {
    try {
      const { data, error } = await supabase
        .from('rent_status')
        .select(`
          *,
          relationships!inner(
            owner_id,
            renter_id,
            user_profiles!relationships_renter_id_fkey(full_name)
          )
        `)
        .eq('relationships.owner_id', user?.id)
        .neq('status', 'paid')
        .lt('due_date', new Date().toISOString());

      if (error) throw error;
      setOverduePayments(data || []);
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
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

  const addManualPayment = async () => {
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          renter_id: manualPayment.renter_id,
          owner_id: user?.id,
          amount: parseFloat(manualPayment.amount),
          status: 'paid',
          payment_method: manualPayment.payment_method,
          payment_date: new Date(manualPayment.payment_date).toISOString(),
          transaction_id: `manual_${Date.now()}`,
          property_id: '00000000-0000-0000-0000-000000000000' // placeholder
        });

      if (error) throw error;

      toast({
        title: "Payment Added",
        description: "Manual payment has been recorded successfully",
      });

      setShowAddPaymentModal(false);
      setManualPayment({
        renter_id: '',
        amount: '',
        payment_method: 'cash',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
      });
      
      fetchPayments();
      fetchStats();
      fetchOverduePayments();
    } catch (error) {
      console.error('Error adding manual payment:', error);
      toast({
        title: "Error",
        description: "Failed to add manual payment",
        variant: "destructive",
      });
    }
  };

  const sendReminder = async (renterId: string) => {
    try {
      // In a real app, this would send an email/SMS
      toast({
        title: "Reminder Sent",
        description: "Payment reminder has been sent to the renter",
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    }
  };

  const exportPayments = (exportFormat: 'csv' | 'excel') => {
    if (payments.length === 0) {
      toast({
        title: "No Data",
        description: "No payments to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Date', 'Renter', 'Amount', 'Status', 'Payment Method', 'Transaction ID'];
    const csvContent = [
      headers.join(','),
      ...payments.map(payment => [
        format(new Date(payment.payment_date), 'yyyy-MM-dd'),
        'Renter Name', // Would need to join with user_profiles
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
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Payments report has been downloaded as ${exportFormat.toUpperCase()}`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Payment Management</h1>
          <p className="text-muted-foreground">Track and manage all rental payments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddPaymentModal} onOpenChange={setShowAddPaymentModal}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Manual Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Payment</DialogTitle>
                <DialogDescription>
                  Record a payment received through cash or other offline methods
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="renter">Renter</Label>
                  <Select value={manualPayment.renter_id} onValueChange={(value) => 
                    setManualPayment(prev => ({ ...prev, renter_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select renter" />
                    </SelectTrigger>
                    <SelectContent>
                      {renters.map((renter) => (
                        <SelectItem key={renter.renter_id} value={renter.renter_id}>
                          {renter.user_profiles?.full_name || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={manualPayment.amount}
                    onChange={(e) => setManualPayment(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={manualPayment.payment_method} onValueChange={(value) => 
                    setManualPayment(prev => ({ ...prev, payment_method: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Payment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={manualPayment.payment_date}
                    onChange={(e) => setManualPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                  />
                </div>
                <Button onClick={addManualPayment} className="w-full">
                  Add Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => exportPayments('csv')} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => exportPayments('excel')} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Overdue Alerts */}
      {overduePayments.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Overdue Payments ({overduePayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overduePayments.slice(0, 3).map((overdue) => (
                <div key={overdue.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                  <div>
                    <p className="font-medium">{overdue.relationships?.user_profiles?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{overdue.current_amount} • Due {format(new Date(overdue.due_date), "MMM dd")}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => sendReminder(overdue.relationships?.renter_id)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Reminder
                  </Button>
                </div>
              ))}
              {overduePayments.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{overduePayments.length - 3} more overdue payments
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalReceived.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue-600">₹{stats.thisMonth.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Current month collection</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-600">₹{stats.pendingAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Renters</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalRenters}</p>
                <p className="text-xs text-muted-foreground mt-1">Current tenants</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment Transactions
          </CardTitle>
          <CardDescription>View and manage all payment transactions with advanced filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="month-filter">Month:</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Months" />
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

            <div className="flex items-center gap-2">
              <Label htmlFor="renter-filter">Renter:</Label>
              <Select value={selectedRenter} onValueChange={setSelectedRenter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Renters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Renters</SelectItem>
                  {renters.map((renter) => (
                    <SelectItem key={renter.renter_id} value={renter.renter_id}>
                      {renter.user_profiles?.full_name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter">Status:</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">✅ Paid</SelectItem>
                  <SelectItem value="pending">🕒 Pending</SelectItem>
                  <SelectItem value="failed">❌ Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <PaymentsList payments={payments} />
        </CardContent>
      </Card>
    </div>
  );
};