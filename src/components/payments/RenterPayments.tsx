import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  Calendar, 
  CreditCard, 
  History, 
  Home, 
  User, 
  MapPin, 
  Download, 
  CheckCircle, 
  Clock,
  XCircle,
  FileText,
  Bell
} from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { PaymentHistory } from "./PaymentHistory";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, addDays } from "date-fns";

interface RentStatus {
  id: string;
  current_amount: number;
  due_date: string;
  status: string;
  relationship_id: string;
}

interface RentalInfo {
  propertyName: string;
  address: string;
  ownerName: string;
  ownerPhone: string;
  monthlyRent: number;
}

interface PaymentStats {
  totalPaid: number;
  thisYear: number;
  averageMonthly: number;
  lastPaymentDate: string | null;
}

export const RenterPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rentStatus, setRentStatus] = useState<RentStatus | null>(null);
  const [rentalInfo, setRentalInfo] = useState<RentalInfo | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalPaid: 0,
    thisYear: 0,
    averageMonthly: 0,
    lastPaymentDate: null
  });
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    if (user) {
      fetchRentStatus();
      fetchRentalInfo();
      fetchPaymentStats();
      fetchRecentPayments();
    }
  }, [user, selectedYear]);

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

  const fetchRentalInfo = async () => {
    try {
      // Get relationship first
      const { data: relationships, error: relationshipError } = await supabase
        .from('relationships')
        .select('id, owner_id')
        .eq('renter_id', user?.id)
        .eq('status', 'accepted')
        .eq('archived', false)
        .single();

      if (relationshipError) throw relationshipError;

      if (relationships) {
        // Get owner profile separately
        const { data: ownerProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name, phone, property_name, property_location')
          .eq('id', relationships.owner_id)
          .single();

        if (profileError) throw profileError;

        setRentalInfo({
          propertyName: ownerProfile?.property_name || 'N/A',
          address: ownerProfile?.property_location || 'N/A',
          ownerName: ownerProfile?.full_name || 'N/A',
          ownerPhone: ownerProfile?.phone || 'N/A',
          monthlyRent: 0 // We'll get this from rent_status
        });
      }
    } catch (error) {
      console.error('Error fetching rental info:', error);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .eq('renter_id', user?.id)
        .eq('status', 'paid')
        .order('payment_date', { ascending: false });

      if (error) throw error;

      const currentYear = parseInt(selectedYear);
      const yearPayments = payments?.filter(p => 
        new Date(p.payment_date).getFullYear() === currentYear
      ) || [];

      const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const thisYear = yearPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const averageMonthly = yearPayments.length > 0 ? thisYear / yearPayments.length : 0;
      const lastPaymentDate = payments?.[0]?.payment_date || null;

      setPaymentStats({
        totalPaid,
        thisYear,
        averageMonthly,
        lastPaymentDate
      });
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('renter_id', user?.id)
        .order('payment_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentPayments(data || []);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  const downloadReceipt = async (payment: any) => {
    // Generate a simple receipt
    const receiptContent = `
RENT PAYMENT RECEIPT
--------------------
Payment ID: ${payment.id}
Transaction ID: ${payment.razorpay_payment_id || payment.transaction_id || 'N/A'}
Amount: ₹${payment.amount}
Date: ${format(new Date(payment.payment_date), 'dd/MM/yyyy')}
Status: ${payment.status}
Method: ${payment.payment_method || 'UPI'}

Property: ${rentalInfo?.propertyName || 'N/A'}
Owner: ${rentalInfo?.ownerName || 'N/A'}

Thank you for your payment!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Payment receipt has been downloaded successfully",
    });
  };

  const markAsPaidManually = async () => {
    if (!rentStatus) return;
    
    try {
      const { error } = await supabase
        .from('rent_status')
        .update({ status: 'paid' })
        .eq('id', rentStatus.id);

      if (error) throw error;

      // Create a manual payment record
      await supabase
        .from('payments')
        .insert({
          renter_id: user?.id,
          amount: rentStatus.current_amount,
          status: 'paid',
          payment_method: 'manual',
          relationship_id: rentStatus.relationship_id,
          property_id: '00000000-0000-0000-0000-000000000000' // placeholder
        });

      toast({
        title: "Payment Marked as Paid",
        description: "Rent has been marked as paid manually",
      });

      fetchRentStatus();
      fetchPaymentStats();
      fetchRecentPayments();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark payment as paid",
        variant: "destructive",
      });
    }
  };

  const isOverdue = rentStatus && new Date(rentStatus.due_date) < new Date() && rentStatus.status !== 'paid';
  const isDueSoon = rentStatus && isAfter(new Date(rentStatus.due_date), new Date()) && 
                    isBefore(new Date(rentStatus.due_date), addDays(new Date(), 3));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!rentStatus) {
    return (
      <div className="text-center py-12">
        <Home className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Active Rental</h3>
        <p className="text-muted-foreground mb-4">
          You don't have any active rental agreements. Connect with a property owner to get started.
        </p>
        <Button variant="outline">Find Property Owners</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Rent Payments</h1>
          <p className="text-muted-foreground">Manage your rental payments and history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHistory(true)}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
          {isDueSoon && (
            <Button variant="outline" size="sm" className="text-yellow-600">
              <Bell className="mr-2 h-4 w-4" />
              Due Soon
            </Button>
          )}
        </div>
      </div>

      {/* Rental Info Card */}
      {rentalInfo && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Home className="h-5 w-5" />
              Current Rental
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{rentalInfo.propertyName}</p>
                    <p className="text-sm text-muted-foreground">{rentalInfo.address}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{rentalInfo.ownerName}</p>
                    <p className="text-sm text-muted-foreground">{rentalInfo.ownerPhone}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">₹{paymentStats.totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">₹{paymentStats.thisYear.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">This Year</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">₹{Math.round(paymentStats.averageMonthly).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Avg Monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-bold">
                  {paymentStats.lastPaymentDate 
                    ? format(new Date(paymentStats.lastPaymentDate), "MMM dd") 
                    : "Never"}
                </p>
                <p className="text-xs text-muted-foreground">Last Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Rent Status */}
      <Card className={`border-2 ${
        isOverdue ? 'border-red-200 bg-red-50/30' : 
        isDueSoon ? 'border-yellow-200 bg-yellow-50/30' : 
        rentStatus.status === 'paid' ? 'border-green-200 bg-green-50/30' : ''
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(isOverdue ? 'overdue' : rentStatus.status)}
            Current Rent Status
            <Badge 
              className={`ml-auto ${getStatusColor(isOverdue ? 'overdue' : rentStatus.status)}`}
            >
              {rentStatus.status === 'paid' ? '✅ Paid' : isOverdue ? '❌ Overdue' : '🕒 Pending'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-sm font-medium text-muted-foreground mb-1">Amount Due</p>
              <p className="text-3xl font-bold text-foreground">₹{rentStatus.current_amount.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-sm font-medium text-muted-foreground mb-1">Due Date</p>
              <p className="text-lg font-semibold flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(rentStatus.due_date), "MMM dd, yyyy")}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background">
              <p className="text-sm font-medium text-muted-foreground mb-1">Days Remaining</p>
              <p className="text-lg font-semibold">
                {isOverdue 
                  ? `${Math.abs(Math.ceil((new Date().getTime() - new Date(rentStatus.due_date).getTime()) / (1000 * 3600 * 24)))} days overdue`
                  : `${Math.ceil((new Date(rentStatus.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days left`
                }
              </p>
            </div>
          </div>

          {(isOverdue || isDueSoon) && (
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${
              isOverdue ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <AlertCircle className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`} />
              <div className="flex-1">
                <p className={`font-medium ${isOverdue ? 'text-red-800' : 'text-yellow-800'}`}>
                  {isOverdue ? 'Payment Overdue!' : 'Payment Due Soon'}
                </p>
                <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                  {isOverdue 
                    ? 'Your rent payment is overdue. Please pay immediately to avoid penalties.'
                    : 'Your rent payment is due in the next few days. Pay now to avoid late fees.'
                  }
                </p>
              </div>
            </div>
          )}

          {rentStatus.status !== 'paid' && (
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="flex-1"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay with UPI
              </Button>
              <Button 
                onClick={markAsPaidManually}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2023, 2022].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p>No payment history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), "MMM dd, yyyy")} • {payment.payment_method?.toUpperCase() || 'UPI'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                    {payment.status === 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadReceipt(payment)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={rentStatus.current_amount}
          relationshipId={rentStatus.relationship_id}
          onSuccess={() => {
            fetchRentStatus();
            fetchPaymentStats();
            fetchRecentPayments();
            setShowPaymentModal(false);
          }}
        />
      )}

      {showHistory && (
        <PaymentHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};