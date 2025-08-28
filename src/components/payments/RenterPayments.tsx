import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { supabase } from "@/integrations/supabase/client";
import { uploadMeterPhoto } from '@/services/MeterPhotoService';
import { MeterPhotoUpload } from '@/components/ui/MeterPhotoUpload';
import { toast as toastNotification } from 'sonner';
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
import { format, isBefore } from "date-fns";

// Simple date helper functions
const isAfter = (date1: Date, date2: Date) => date1.getTime() > date2.getTime();
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PaymentModal } from "./PaymentModal";
import { PaymentSuccessModal } from "./PaymentSuccessModal";
import { PaymentFailureModal } from "./PaymentFailureModal";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { QRPaymentModal } from "./QRPaymentModal";

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
  ownerUpiId: string;
  ownerPhoneNumber: string;
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
  const [showPaymentMethodSelector, setShowPaymentMethodSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [ownerUpiDetails, setOwnerUpiDetails] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string>("");
  const [lastPaymentDetails, setLastPaymentDetails] = useState<any>(null);
  const [showElectricityDialog, setShowElectricityDialog] = useState(false);
  const [showMeterUpload, setShowMeterUpload] = useState(false);
  const [electricityOption, setElectricityOption] = useState<'upload' | 'owner' | null>(null);
  const [electricityAmount, setElectricityAmount] = useState<number>(0);
  const [meterPhoto, setMeterPhoto] = useState<File | null>(null);
  const [meterPhotoUrl, setMeterPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeRelationship, setActiveRelationship] = useState<any | null>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentRent();
      fetchRentalInfo();
      fetchPaymentStats();
      fetchRecentPayments();
    }
  }, [user, selectedYear]);

  // Fetch owner's UPI details when the active relationship becomes available
  useEffect(() => {
    if (user && activeRelationship?.owner_id) {
      fetchOwnerUpiDetails();
    }
  }, [user, activeRelationship?.owner_id]);

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
        const relationship = relationships[0];
        const relationshipId = relationship.id;
        setActiveRelationship(relationship);

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
            .select('full_name, phone, property_name, property_location, upi_id, upi_phone_number')
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
          ownerUpiId: ownerProfile?.upi_id || 'Not provided',
          ownerPhoneNumber: ownerProfile?.upi_phone_number || '',
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

  const handlePaymentSuccess = async (paymentDetails?: any) => {
    setShowPaymentModal(false);
    setShowElectricityDialog(false);
    
    if (paymentDetails) {
      setLastPaymentDetails({
        amount: (currentRent?.current_amount || 0) + electricityAmount,
        transactionId: paymentDetails.razorpay_payment_id || 'N/A',
        date: new Date().toISOString(),
        propertyName: rentalInfo?.propertyName
      });
      setShowSuccessModal(true);
    }
    
    // Reset electricity options after successful payment
    setElectricityOption(null);
    setElectricityAmount(0);
    setMeterPhoto(null);
    fetchCurrentRent();
    fetchPaymentStats();
    fetchRecentPayments();
  };

  const handlePaymentFailure = (error: string) => {
    setShowPaymentModal(false);
    setPaymentError(error);
    setShowFailureModal(true);
  };

  const fetchOwnerUpiDetails = async () => {
    try {
      if (!activeRelationship?.owner_id) {
        console.log('No active relationship or owner_id:', activeRelationship);
        return;
      }

      console.log('Fetching UPI details for owner:', activeRelationship.owner_id);
      const { data, error } = await supabase
        .from('owner_upi_details')
        .select('*')
        .eq('owner_id', activeRelationship.owner_id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching owner UPI details:', error);
        throw error;
      }
      
      console.log('Owner UPI details fetched:', data);
      setOwnerUpiDetails(data);
    } catch (error) {
      console.error('Error fetching owner UPI details:', error);
    }
  };

  const handlePayNow = async () => {
    // First, fetch owner UPI details to check for QR code
    await fetchOwnerUpiDetails();
    
    // Always show QR payment modal directly (no method selector)
    if (ownerUpiDetails?.upi_id) {
      setShowUpiModal(true);
    } else {
      toast({ 
        description: "Owner has not set up UPI payments yet", 
        variant: "destructive" 
      });
    }
  };

  const handleSelectRazorpay = () => {
    setShowPaymentMethodSelector(false);
    setShowPaymentModal(true);
  };

  const handleSelectUpiDirect = () => {
    setShowPaymentMethodSelector(false);
    if (ownerUpiDetails) {
      setShowUpiModal(true);
    } else {
      toast({ 
        description: "Owner has not set up UPI direct payments yet", 
        variant: "destructive" 
      });
    }
  };

  const handleUpiPaymentSuccess = () => {
    setShowUpiModal(false);
    toast({
      title: "Payment Submitted",
      description: "Your payment proof has been submitted for verification",
    });
    fetchCurrentRent();
    fetchRecentPayments();
  };

  const handleElectricityOptionSelect = async (option: 'upload' | 'owner') => {
    setElectricityOption(option);
    
    if (option === 'upload') {
      // Close electricity dialog and show meter upload
      setShowElectricityDialog(false);
      setShowMeterUpload(true);
    } else {
      // Close electricity dialog and show payment modal directly
      setShowElectricityDialog(false);
      setShowPaymentModal(true);
    }
  };

  const handleMeterPhotoUploaded = (photoUrl: string, file: File) => {
    setMeterPhoto(file);
    setMeterPhotoUrl(photoUrl);
    setShowMeterUpload(false);
    setShowPaymentModal(true);
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
                    onClick={handlePayNow}
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

      {/* Modern Electricity Options Dialog */}
      <Dialog open={showElectricityDialog} onOpenChange={setShowElectricityDialog}>
        <DialogContent className="sm:max-w-md mx-4 p-0 border-0 bg-transparent shadow-none">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-6 shadow-2xl border border-slate-200/50">
            <DialogHeader className="text-center mb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Electricity Bill Setup
              </DialogTitle>
              <DialogDescription className="text-slate-600 mt-2 text-base">
                Choose how you'd like to handle your electricity bill
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Button
                onClick={() => handleElectricityOptionSelect('upload')}
                className="w-full h-16 bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-xl flex items-center justify-start gap-4 p-6 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                style={{ minHeight: '64px' }}
              >
                <div className="flex-shrink-0">
                  <Camera className="h-8 w-8" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">📸 Upload My Meter Photo</div>
                  <div className="text-sm opacity-90">Take a photo of your meter reading</div>
                </div>
              </Button>
              
              <Button
                onClick={() => handleElectricityOptionSelect('owner')}
                className="w-full h-16 bg-gradient-to-br from-muted to-muted/80 hover:from-muted/80 hover:to-muted text-foreground rounded-xl flex items-center justify-start gap-4 p-6 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl border border-border"
                style={{ minHeight: '64px' }}
              >
                <div className="flex-shrink-0">
                  <Calculator className="h-8 w-8" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">🧾 Owner Will Send Bill</div>
                  <div className="text-sm opacity-70">PG owner calculates separately</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meter Photo Upload Modal */}
      {activeRelationship && (
        <MeterPhotoUpload
          isOpen={showMeterUpload}
          onClose={() => setShowMeterUpload(false)}
          onPhotoUploaded={handleMeterPhotoUploaded}
          relationshipId={activeRelationship.id}
          renterId={user?.id || ''}
          ownerId={activeRelationship.owner_id}
        />
      )}

      {/* Payment Modal with Electricity Amount Input */}
      {showPaymentModal && (
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="sm:max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                Add electricity bill amount and proceed with payment
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Electricity Option Display */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Electricity Bill</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {electricityOption === 'upload' ? '📸 Meter photo uploaded' : '🧾 Owner will calculate bill'}
                  {meterPhoto && (
                    <div className="mt-2 text-green-600 font-medium">
                      ✓ Photo uploaded: {meterPhoto.name}
                      {meterPhotoUrl && (
                        <div className="mt-1">
                          <img 
                            src={meterPhotoUrl} 
                            alt="Meter photo" 
                            className="w-20 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {isUploading && (
                    <div className="mt-2 text-primary font-medium">
                      📤 Uploading meter photo...
                    </div>
                  )}
                </div>
              </div>

              {/* Electricity Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Electricity Bill Amount (₹)
                </label>
                <input
                  type="number"
                  value={electricityAmount || ''}
                  onChange={(e) => setElectricityAmount(Number(e.target.value) || 0)}
                  placeholder="Enter electricity bill amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-lg"
                />
              </div>

              {/* Total Amount Display */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-sm text-primary/80 mb-1">Total Payment Amount</div>
                <div className="text-2xl font-bold text-foreground">
                  ₹{((currentRent?.current_amount || 0) + electricityAmount).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Rent: ₹{(currentRent?.current_amount || 0).toLocaleString()} + 
                  Electricity: ₹{electricityAmount.toLocaleString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    if (currentRent) {
                      // Create a new payment modal with the right amount
                      setTimeout(() => setShowPaymentModal(true), 100);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  disabled={!currentRent}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Pay
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Razorpay Payment Modal */}
      {showPaymentModal && currentRent && !showElectricityDialog && !showMeterUpload && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={(currentRent.current_amount || 0) + electricityAmount}
          relationshipId={currentRent.relationship_id}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && lastPaymentDetails && (
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          paymentDetails={lastPaymentDetails}
          onDownloadReceipt={() => downloadReceipt(lastPaymentDetails.transactionId)}
          onGoHome={() => {
            setShowSuccessModal(false);
            navigate('/dashboard');
          }}
        />
      )}

      {/* Payment Method Selector */}
      {showPaymentMethodSelector && currentRent && (
        <PaymentMethodSelector
          isOpen={showPaymentMethodSelector}
          onClose={() => setShowPaymentMethodSelector(false)}
          amount={(currentRent.current_amount || 0) + electricityAmount}
          onSelectRazorpay={handleSelectRazorpay}
          onSelectUpiDirect={handleSelectUpiDirect}
        />
      )}

      {/* QR Direct Payment Modal */}
      {showUpiModal && currentRent && ownerUpiDetails && (
        <QRPaymentModal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          amount={(currentRent.current_amount || 0) + electricityAmount}
          relationshipId={currentRent.relationship_id}
          ownerUpiId={ownerUpiDetails.upi_id}
          ownerQrCodeUrl={ownerUpiDetails.qr_code_url}
          ownerName={rentalInfo?.ownerName || 'Owner'}
          onSuccess={handleUpiPaymentSuccess}
        />
      )}

      {/* Failure Modal */}
      {showFailureModal && (
        <PaymentFailureModal
          isOpen={showFailureModal}
          onClose={() => setShowFailureModal(false)}
          onRetry={() => {
            setShowFailureModal(false);
            setShowPaymentModal(true);
          }}
          errorMessage={paymentError}
          amount={(currentRent?.current_amount || 0) + electricityAmount}
        />
      )}
    </div>
  );
};
