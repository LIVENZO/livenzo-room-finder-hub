
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchRentStatus, fetchPaymentHistory, initializeRentStatus, type RentStatus, type Payment } from '@/services/PaymentService';
import PaymentModal from '@/components/payment/PaymentModal';

interface RenterPaymentsProps {
  relationshipId: string;
}

const RenterPayments: React.FC<RenterPaymentsProps> = ({ relationshipId }) => {
  const [rentStatus, setRentStatus] = useState<RentStatus | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, [relationshipId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // Fetch rent status
      let status = await fetchRentStatus(relationshipId);
      
      // If no rent status exists, initialize it
      if (!status) {
        await initializeRentStatus(relationshipId);
        status = await fetchRentStatus(relationshipId);
      }
      
      setRentStatus(status);
      
      // Fetch payment history
      const history = await fetchPaymentHistory(relationshipId);
      setPaymentHistory(history);
      
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'default' as const;
      case 'pending':
        return 'secondary' as const;
      case 'overdue':
      case 'failed':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const isOverdue = rentStatus && new Date(rentStatus.due_date) < new Date() && rentStatus.status !== 'paid';
  const currentStatus = isOverdue ? 'overdue' : rentStatus?.status || 'pending';

  const handlePaymentSuccess = () => {
    loadPaymentData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading payment information...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Rent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Rent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
            <div>
              <p className="text-2xl font-bold">₹{rentStatus?.current_amount || 1200}</p>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Due: {rentStatus?.due_date ? new Date(rentStatus.due_date).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              {isOverdue && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Payment is overdue
                </p>
              )}
            </div>
            
            <div className="text-right">
              <Badge 
                variant={getStatusVariant(currentStatus)}
                className="mb-3 flex items-center gap-1 w-fit ml-auto"
              >
                {getStatusIcon(currentStatus)}
                {currentStatus === 'overdue' ? 'Overdue' : 
                 currentStatus === 'paid' ? 'Paid' : 'Pending'}
              </Badge>
              
              {currentStatus !== 'paid' && (
                <Button 
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No payment history available
              </p>
            ) : (
              paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.payment_status)}
                    <div>
                      <p className="font-medium">₹{payment.amount}</p>
                      <p className="text-sm text-gray-500">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'Processing'} • {payment.payment_method}
                      </p>
                      {payment.transaction_id && (
                        <p className="text-xs text-gray-400">
                          ID: {payment.transaction_id}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant={getStatusVariant(payment.payment_status)}>
                    {payment.payment_status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && rentStatus && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          relationshipId={relationshipId}
          ownerId={rentStatus.relationship_id} // This should be owner_id, will need to fetch from relationship
          initialAmount={rentStatus.current_amount}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default RenterPayments;
