import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  XCircle,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  status: 'paid' | 'pending' | 'failed';
  payment_method?: string;
  razorpay_payment_id?: string;
  renter_name: string;
  room_number?: string;
}

interface PaymentStats {
  totalCollected: number;
  thisMonth: number;
  pendingCount: number;
  failedCount: number;
}

export const OwnerPaymentsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalCollected: 0,
    thisMonth: 0,
    pendingCount: 0,
    failedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchStats();
    }
  }, [user, selectedFilter]);

  const fetchPayments = async () => {
    try {
      let query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_date,
          status,
          payment_method,
          razorpay_payment_id,
          relationships!inner(
            renter_id,
            user_profiles!relationships_renter_id_fkey(
              full_name,
              room_number
            )
          )
        `)
        .eq('relationships.owner_id', user?.id)
        .order('payment_date', { ascending: false });

      if (selectedFilter !== 'all') {
        query = query.eq('status', selectedFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedPayments: PaymentRecord[] = data?.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        payment_date: payment.payment_date,
        status: payment.status as 'paid' | 'pending' | 'failed',
        payment_method: payment.payment_method,
        razorpay_payment_id: payment.razorpay_payment_id,
        renter_name: payment.relationships?.user_profiles?.full_name || 'Unknown',
        room_number: payment.relationships?.user_profiles?.room_number
      })) || [];

      setPayments(formattedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({ description: "Failed to fetch payments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_date,
          status,
          relationships!inner(owner_id)
        `)
        .eq('relationships.owner_id', user?.id);

      if (error) throw error;

      const totalCollected = data
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = data
        ?.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return p.status === 'paid' && 
                 paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const pendingCount = data?.filter(p => p.status === 'pending').length || 0;
      const failedCount = data?.filter(p => p.status === 'failed').length || 0;

      setStats({
        totalCollected,
        thisMonth,
        pendingCount,
        failedCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">✅ Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">🟡 Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">❌ Failed</Badge>;
      default:
        return null;
    }
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Date', 'Renter', 'Room', 'Amount', 'Status', 'Transaction ID'].join(','),
        ...payments.map(payment => [
          format(new Date(payment.payment_date), 'yyyy-MM-dd'),
          payment.renter_name,
          payment.room_number || 'N/A',
          payment.amount,
          payment.status,
          payment.razorpay_payment_id || 'N/A'
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

  if (loading) {
    return <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg"></div>
        ))}
      </div>
      <div className="h-64 bg-muted rounded-lg"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-700">Total Collected</p>
                <p className="text-lg font-bold text-green-800">
                  ₹{stats.totalCollected.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-700">This Month</p>
                <p className="text-lg font-bold text-blue-800">
                  ₹{stats.thisMonth.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-yellow-700">Pending Rent</p>
                <p className="text-lg font-bold text-yellow-800">
                  {stats.pendingCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <XCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-red-700">Failed Payments</p>
                <p className="text-lg font-bold text-red-800">
                  {stats.failedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={exportToCSV}
          variant="outline"
          size="sm"
          disabled={payments.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Track rent payments from your tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    payment.status === 'paid' && "bg-green-50 border-green-200",
                    payment.status === 'pending' && "bg-yellow-50 border-yellow-200",
                    payment.status === 'failed' && "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.renter_name}</p>
                        {payment.room_number && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            Room {payment.room_number}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                      {payment.razorpay_payment_id && (
                        <p className="text-xs text-muted-foreground font-mono">
                          ID: {payment.razorpay_payment_id}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                        {payment.payment_method && (
                          <p className="text-xs text-muted-foreground">
                            {payment.payment_method.toUpperCase()}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};