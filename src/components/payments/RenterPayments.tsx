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
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const [currentRent, setCurrentRent] = useState<RentStatus | null>(null);
  const [rentalInfo, setRentalInfo] = useState<RentalInfo | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalPaid: 0,
    thisYear: 0,
    averageMonthly: 0,
    lastPaymentDate: null
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [markingAsPaid, setMarkingAsPaid] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCurrentRent();
      fetchRentalInfo();
      fetchPaymentStats();
      fetchRecentPayments();
    }
  }, [user, selectedYear]);

  const fetchCurrentRent = async () => {
    try {
      // Simplified current rent fetch
      setCurrentRent({
        id: 'sample-rent-id',
        current_amount: 25000,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        relationship_id: 'sample-relationship-id'
      });
    } catch (error) {
      console.error('Error in fetchCurrentRent:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalInfo = async () => {
    try {
      // Simplified rental info fetch
      setRentalInfo({
        propertyName: 'Sample Property',
        address: 'Sample Address',
        ownerName: 'Owner Name',
        ownerPhone: '123-456-7890',
        monthlyRent: 25000
      });
    } catch (error) {
      console.error('Error fetching rental info:', error);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      // Simplified payment stats
      setPaymentStats({
        totalPaid: 150000,
        thisYear: 75000,
        averageMonthly: 25000,
        lastPaymentDate: '2024-01-15'
      });
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      // Simplified recent payments
      setRecentPayments([
        {
          id: '1',
          amount: 25000,
          payment_date: '2024-01-15',
          status: 'paid'
        }
      ]);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      // Create a simple receipt
      const receiptContent = `
        RENT PAYMENT RECEIPT
        ====================
        Payment ID: ${paymentId}
        Date: ${new Date().toLocaleDateString()}
        Amount: ₹${currentRent?.current_amount.toLocaleString()}
        Property: ${rentalInfo?.propertyName}
        
        Thank you for your payment!
      `;
      
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ description: "Receipt downloaded successfully!" });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({ description: "Failed to download receipt", variant: "destructive" });
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    toast({ description: "Payment successful!" });
    fetchCurrentRent();
    fetchPaymentStats();
    fetchRecentPayments();
  };

  const handleMarkAsPaid = async (rentId: string) => {
    setMarkingAsPaid(true);
    try {
      const { error } = await supabase
        .from('rent_status')
        .update({ status: 'paid' })
        .eq('id', rentId);

      if (error) throw error;

      toast({ description: "Rent marked as paid successfully!" });
      fetchCurrentRent();
      fetchPaymentStats();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({ description: "Failed to mark as paid", variant: "destructive" });
    } finally {
      setMarkingAsPaid(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rent Payments</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex-1 sm:flex-none"
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
      </div>

      {/* Active Rental Info */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">Current Rental</CardTitle>
              <CardDescription className="truncate">Your active rental information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rentalInfo ? (
            <>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium break-words">{rentalInfo.propertyName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 break-words">{rentalInfo.address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium break-words">{rentalInfo.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-lg font-bold text-green-600">
                      ₹{rentalInfo.monthlyRent.toLocaleString()}/month
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No active rental found</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/connections')}
                className="w-full sm:w-auto"
              >
                Connect with Owner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-green-700">Total Paid</p>
                <p className="text-lg sm:text-2xl font-bold text-green-800 truncate">
                  ₹{paymentStats.totalPaid.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-blue-700">This Year</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-800 truncate">
                  ₹{paymentStats.thisYear.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-purple-700">Avg Monthly</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-800 truncate">
                  ₹{paymentStats.averageMonthly.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-orange-700">Last Payment</p>
                <p className="text-sm sm:text-lg font-bold text-orange-800 truncate">
                  {paymentStats.lastPaymentDate 
                    ? format(new Date(paymentStats.lastPaymentDate), 'MMM dd, yyyy')
                    : 'None'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Rent Status */}
      {currentRent && (
        <Card className={cn(
          "border-l-4",
          currentRent.status === 'paid' ? 'border-l-green-500 bg-green-50' :
          currentRent.status === 'overdue' ? 'border-l-red-500 bg-red-50' :
          'border-l-yellow-500 bg-yellow-50'
        )}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {currentRent.status === 'paid' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : currentRent.status === 'overdue' ? (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  )}
                  <span className="truncate">Current Month Rent</span>
                </CardTitle>
                <CardDescription className="truncate">
                  Due: {format(new Date(currentRent.due_date), 'MMMM dd, yyyy')}
                </CardDescription>
              </div>
              <Badge variant={
                currentRent.status === 'paid' ? 'default' :
                currentRent.status === 'overdue' ? 'destructive' :
                'secondary'
              } className="flex-shrink-0">
                {currentRent.status === 'paid' ? '✅ Paid' :
                 currentRent.status === 'overdue' ? '❌ Overdue' :
                 '🕒 Pending'
                }
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold">
                  ₹{currentRent.current_amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Amount Due</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-600">Days {isAfter(new Date(currentRent.due_date), new Date()) ? 'remaining' : 'overdue'}</p>
                <p className="text-lg font-semibold">
                  {Math.abs(Math.ceil((new Date(currentRent.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))}
                </p>
              </div>
            </div>
            
            {currentRent.status !== 'paid' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1"
                  onClick={() => toast({ description: "Payment feature will be available soon!" })}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMarkAsPaid(currentRent.id)}
                  disabled={markingAsPaid}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {markingAsPaid ? 'Marking...' : 'Mark as Paid'}
                </Button>
              </div>
            )}

            {currentRent.status === 'paid' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => downloadReceipt(currentRent.id)}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Year Selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="text-lg sm:text-xl">Payment Overview</CardTitle>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length > 0 ? (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded-lg gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">₹{Number(payment.amount).toLocaleString()}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="w-fit sm:flex-shrink-0">
                    ✅ Paid
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No payments found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payment History</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Payment history will be displayed here
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};