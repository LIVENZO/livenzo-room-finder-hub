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
  Camera,
  Calculator,
  Zap
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PaymentModal } from "./PaymentModal";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showElectricityDialog, setShowElectricityDialog] = useState(false);
  const [electricityOption, setElectricityOption] = useState<'upload' | 'owner' | null>(null);
  const [electricityAmount, setElectricityAmount] = useState<number>(0);
  const [meterPhoto, setMeterPhoto] = useState<File | null>(null);

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
      // Get renter's relationship
      const { data: relationships, error: relError } = await supabase
        .from('relationships')
        .select('id, owner_id')
        .eq('renter_id', user?.id)
        .eq('status', 'accepted')
        .eq('archived', false)
        .limit(1);

      if (relError) throw relError;

      if (relationships && relationships.length > 0) {
        const relationshipId = relationships[0].id;

        // Get current rent status
        const { data: rentStatus, error: rentError } = await supabase
          .from('rent_status')
          .select('*')
          .eq('relationship_id', relationshipId)
          .limit(1);

        if (rentError) throw rentError;

        if (rentStatus && rentStatus.length > 0) {
          // Add relationship_id to the rent status for easy access
          const rentWithRelationship = {
            ...rentStatus[0],
            relationship_id: relationshipId
          };
          setCurrentRent(rentWithRelationship);
        } else {
          // If no rent status exists, don't create a default one - let owner set it
          console.log('No rent status found for relationship:', relationshipId);
          setCurrentRent(null);
        }
      }
    } catch (error) {
      console.error('Error in fetchCurrentRent:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalInfo = async () => {
    try {
      // Get renter's active relationship with owner details
      const { data: relationships, error } = await supabase
        .from('relationships')
        .select('id, owner_id')
        .eq('renter_id', user?.id)
        .eq('status', 'accepted')
        .eq('archived', false)
        .limit(1);

      if (error) throw error;

      if (relationships && relationships.length > 0) {
        const relationship = relationships[0];
        
        // Get owner profile and rent status
        const [ownerProfileResponse, rentStatusResponse] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('full_name, phone, property_name, property_location')
            .eq('id', relationship.owner_id)
            .single(),
          supabase
            .from('rent_status')
            .select('current_amount')
            .eq('relationship_id', relationship.id)
            .limit(1)
        ]);

        const ownerProfile = ownerProfileResponse.data;
        const rentAmount = rentStatusResponse.data?.[0]?.current_amount || 0;

        setRentalInfo({
          propertyName: ownerProfile?.property_name || 'Property',
          address: ownerProfile?.property_location || 'Address not available',
          ownerName: ownerProfile?.full_name || 'Owner',
          ownerPhone: ownerProfile?.phone || 'Phone not available',
          monthlyRent: rentAmount
        });
      }
    } catch (error) {
      console.error('Error fetching rental info:', error);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      // Get all payments for this renter
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .eq('renter_id', user?.id)
        .eq('status', 'paid')
        .order('payment_date', { ascending: false });

      if (error) throw error;

      const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const currentYear = new Date().getFullYear();
      const thisYear = payments
        ?.filter(p => new Date(p.payment_date).getFullYear() === currentYear)
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const averageMonthly = payments && payments.length > 0 
        ? totalPaid / Math.max(1, payments.length) 
        : 0;

      const lastPaymentDate = payments && payments.length > 0 
        ? payments[0].payment_date 
        : null;

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
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('renter_id', user?.id)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPayments(payments || []);
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
        Amount: ₹${((currentRent?.current_amount || 0) + electricityAmount).toLocaleString()}
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

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setShowElectricityDialog(false);
    toast({ description: "Payment successful!" });
    // Reset electricity options after successful payment
    setElectricityOption(null);
    setElectricityAmount(0);
    setMeterPhoto(null);
    fetchCurrentRent();
    fetchPaymentStats();
    fetchRecentPayments();
  };

  const handlePayNowClick = () => {
    setShowElectricityDialog(true);
  };

  const handleElectricityOptionSelect = (option: 'upload' | 'owner') => {
    setElectricityOption(option);
    setShowElectricityDialog(false);
    setShowPaymentModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMeterPhoto(file);
      toast({ description: "Meter photo uploaded successfully!" });
    }
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
    <div className="space-y-4 sm:space-y-6 w-full overflow-hidden">
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
            {/* Electricity Amount Display */}
            {electricityOption && (
              <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Electricity Bill</span>
                </div>
                <div className="text-sm text-gray-600">
                  {electricityOption === 'upload' ? '📸 Meter photo uploaded' : '🧾 Owner will calculate'}
                  {electricityAmount > 0 && (
                    <span className="ml-2 font-medium text-orange-700">
                      • ₹{electricityAmount.toLocaleString()}
                    </span>
                  )}
                </div>
                {electricityOption && (
                  <div className="mt-3">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">
                        Electricity Bill Amount (₹)
                      </span>
                      <input
                        type="number"
                        value={electricityAmount || ''}
                        onChange={(e) => setElectricityAmount(Number(e.target.value) || 0)}
                        placeholder="Enter electricity bill amount"
                        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold">
                  ₹{(currentRent.current_amount + electricityAmount).toLocaleString()}
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Rent: ₹{currentRent.current_amount.toLocaleString()}</div>
                  {electricityAmount > 0 && (
                    <div className="text-orange-600">
                      Electricity: ₹{electricityAmount.toLocaleString()}
                    </div>
                  )}
                  <div className="font-medium">Total Amount Due</div>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-600">Days {isAfter(new Date(currentRent.due_date), new Date()) ? 'remaining' : 'overdue'}</p>
                <p className="text-lg font-semibold">
                  {Math.abs(Math.ceil((new Date(currentRent.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {currentRent.status !== 'paid' && (
                <>
                  <Button 
                    onClick={handlePayNowClick}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    size="lg"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleMarkAsPaid(currentRent.id)}
                    disabled={markingAsPaid}
                    className="flex-1 sm:flex-none"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {markingAsPaid ? 'Marking...' : 'Mark as Paid'}
                  </Button>
                </>
              )}
              {currentRent.status === 'paid' && (
                <Button 
                  variant="outline"
                  onClick={() => downloadReceipt(currentRent.id)}
                  className="flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              )}
            </div>
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

      {/* Electricity Options Dialog */}
      <Dialog open={showElectricityDialog} onOpenChange={setShowElectricityDialog}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
              Electricity Bill Setup
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Choose how you'd like to handle your electricity bill
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Button
              onClick={() => handleElectricityOptionSelect('upload')}
              className="w-full h-20 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex flex-col gap-2 transition-all duration-200 transform hover:scale-105"
            >
              <Camera className="h-8 w-8" />
              <span className="font-semibold text-lg">📸 Upload My Meter Photo</span>
              <span className="text-xs opacity-90">Take a photo of your meter reading</span>
            </Button>
            
            <Button
              onClick={() => handleElectricityOptionSelect('owner')}
              className="w-full h-20 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl flex flex-col gap-2 transition-all duration-200 transform hover:scale-105"
            >
              <Calculator className="h-8 w-8" />
              <span className="font-semibold text-lg">🧾 Owner Will Send Bill</span>
              <span className="text-xs opacity-90">PG owner calculates separately</span>
            </Button>
          </div>

          {/* Hidden file input for photo upload */}
          <input
            type="file"
            ref={(input) => {
              if (input && electricityOption === 'upload') {
                input.click();
              }
            }}
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        amount={((currentRent?.current_amount || 0) + electricityAmount)}
        relationshipId={currentRent?.relationship_id || ''}
      />
    </div>
  );
};