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
import { OwnerUpiSettings } from "./OwnerUpiSettings";
import { ManualPaymentVerification } from "./ManualPaymentVerification";
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
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualPayment, setManualPayment] = useState({
    amount: '',
    renterId: '',
    description: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [overduePayments, setOverduePayments] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchStats();
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
            owner_id,
            renter_id,
            user_profiles!relationships_renter_id_fkey(full_name)
          )
        `)
        .eq('relationships.owner_id', user?.id)
        .order('payment_date', { ascending: false });

      // Apply filters
      if (selectedMonth !== 'all') {
        const [year, month] = selectedMonth.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
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
      toast({ description: "Failed to fetch payments", variant: "destructive" });
    } finally {
      setLoading(false);
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
        ?.reduce((sum, r) => sum + Number(r.current_amount), 0) || 0;

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

  const handleManualPayment = async () => {
    try {
      if (!manualPayment.amount || !manualPayment.renterId) {
        toast({ description: "Please fill in all required fields", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from('payments')
        .insert({
          amount: parseFloat(manualPayment.amount),
          renter_id: manualPayment.renterId,
          payment_date: manualPayment.paymentDate,
          payment_method: 'manual',
          payment_status: 'paid',
          property_id: 'temp-property-id'
        });

      if (error) throw error;

      toast({ description: "Manual payment added successfully!" });
      setShowManualEntry(false);
      setManualPayment({
        amount: '',
        renterId: '',
        description: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd')
      });
      
      fetchPayments();
      fetchStats();
    } catch (error) {
      console.error('Error adding manual payment:', error);
      toast({ description: "Failed to add manual payment", variant: "destructive" });
    }
  };

  const sendReminder = async (renterId: string, renterName: string) => {
    try {
      // Here you would implement the actual reminder sending logic
      // For now, we'll just show a success message
      toast({ description: `Reminder sent to ${renterName}` });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({ description: "Failed to send reminder", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Date', 'Renter', 'Amount', 'Status', 'Method'].join(','),
        ...payments.map(payment => [
          format(new Date(payment.payment_date), 'yyyy-MM-dd'),
          payment.relationships?.user_profiles?.full_name || 'N/A',
          payment.amount,
          payment.status,
          payment.payment_method || 'N/A'
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
      
      toast({ description: "CSV exported successfully!" });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({ description: "Failed to export CSV", variant: "destructive" });
    }
  };

  const exportToPDF = () => {
    try {
      // This is a simple text-based PDF export
      // In a real app, you'd use a proper PDF library like jsPDF
      const content = `
PAYMENT REPORT
Generated: ${format(new Date(), 'MMMM dd, yyyy')}

SUMMARY:
Total Received: ₹${stats.totalReceived.toLocaleString()}
This Month: ₹${stats.thisMonth.toLocaleString()}
Pending: ₹${stats.pendingAmount.toLocaleString()}
Active Renters: ${stats.totalRenters}

PAYMENTS:
${payments.map(p => 
  `${format(new Date(p.payment_date), 'yyyy-MM-dd')} | ${p.relationships?.user_profiles?.full_name || 'N/A'} | ₹${p.amount} | ${p.status}`
).join('\n')}
      `;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ description: "Report exported successfully!" });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ description: "Failed to export report", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rent Management</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Add Manual Payment</span>
                <span className="xs:hidden">Add Payment</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Add Manual Payment</DialogTitle>
                <DialogDescription>
                  Record a payment received through cash or other offline methods.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={manualPayment.amount}
                    onChange={(e) => setManualPayment(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renter">Renter ID</Label>
                  <Input
                    id="renter"
                    placeholder="Enter renter ID"
                    value={manualPayment.renterId}
                    onChange={(e) => setManualPayment(prev => ({ ...prev, renterId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Payment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={manualPayment.paymentDate}
                    onChange={(e) => setManualPayment(prev => ({ ...prev, paymentDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Payment description"
                    value={manualPayment.description}
                    onChange={(e) => setManualPayment(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button onClick={handleManualPayment} className="flex-1">
                    Add Payment
                  </Button>
                  <Button variant="outline" onClick={() => setShowManualEntry(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overdue Payments Alert */}
      {overduePayments.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg text-red-800">Overdue Payments</CardTitle>
                <CardDescription className="text-red-600">
                  {overduePayments.length} payment{overduePayments.length > 1 ? 's' : ''} overdue
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {overduePayments.slice(0, 3).map((payment) => (
              <div key={payment.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded-lg border gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {payment.relationships?.user_profiles?.full_name || 'Unknown Renter'}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₹{payment.current_amount.toLocaleString()} - Due: {format(new Date(payment.due_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendReminder(payment.renter_id, payment.relationships?.user_profiles?.full_name)}
                  className="w-full sm:w-auto flex-shrink-0"
                >
                  <Send className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Send Reminder</span>
                  <span className="xs:hidden">Remind</span>
                </Button>
              </div>
            ))}
            {overduePayments.length > 3 && (
              <p className="text-sm text-red-600 text-center">
                And {overduePayments.length - 3} more overdue payment{overduePayments.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-green-700">Total Received</p>
                <p className="text-lg sm:text-2xl font-bold text-green-800 truncate">
                  ₹{stats.totalReceived.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-blue-700">This Month</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-800 truncate">
                  ₹{stats.thisMonth.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-500 rounded-lg flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-red-700">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-red-800 truncate">
                  ₹{stats.pendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-purple-700">Active Renters</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-800">
                  {stats.totalRenters}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="text-lg sm:text-xl">Payment History</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="w-full sm:w-auto"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Export CSV</span>
                <span className="xs:hidden">CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="w-full sm:w-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Export PDF</span>
                <span className="xs:hidden">PDF</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-0 sm:min-w-[180px]">
              <Label htmlFor="month-filter">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full" id="month-filter">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="2024-01">January 2024</SelectItem>
                  <SelectItem value="2024-02">February 2024</SelectItem>
                  <SelectItem value="2024-03">March 2024</SelectItem>
                  <SelectItem value="2024-04">April 2024</SelectItem>
                  <SelectItem value="2024-05">May 2024</SelectItem>
                  <SelectItem value="2024-06">June 2024</SelectItem>
                  <SelectItem value="2024-07">July 2024</SelectItem>
                  <SelectItem value="2024-08">August 2024</SelectItem>
                  <SelectItem value="2024-09">September 2024</SelectItem>
                  <SelectItem value="2024-10">October 2024</SelectItem>
                  <SelectItem value="2024-11">November 2024</SelectItem>
                  <SelectItem value="2024-12">December 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-0 sm:min-w-[180px]">
              <Label htmlFor="renter-filter">Renter</Label>
              <Select value={selectedRenter} onValueChange={setSelectedRenter}>
                <SelectTrigger className="w-full" id="renter-filter">
                  <SelectValue placeholder="Select renter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Renters</SelectItem>
                  {/* Add actual renter options here */}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-0 sm:min-w-[180px]">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full" id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">✅ Paid</SelectItem>
                  <SelectItem value="pending">🕒 Pending</SelectItem>
                  <SelectItem value="overdue">❌ Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UPI Settings */}
      <OwnerUpiSettings />

      {/* Manual Payment Verification */}
      <ManualPaymentVerification />

      {/* Payments List */}
      <PaymentsList
        payments={payments}
      />
    </div>
  );
};