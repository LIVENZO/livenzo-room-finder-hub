
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { fetchRentStatus, fetchPaymentHistory, type RentStatus, type Payment } from '@/services/PaymentService';
import { toast } from 'sonner';

interface PaymentsTabProps {
  relationshipId: string;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ relationshipId }) => {
  const [rentStatus, setRentStatus] = useState<RentStatus | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
  }, [relationshipId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      const status = await fetchRentStatus(relationshipId);
      setRentStatus(status);
      
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading payment information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Rent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Rent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rentStatus ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">₹{rentStatus.current_amount}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Due: {new Date(rentStatus.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant={getStatusVariant(isOverdue ? 'overdue' : rentStatus.status)}
                  className="flex items-center gap-1"
                >
                  {getStatusIcon(isOverdue ? 'overdue' : rentStatus.status)}
                  {isOverdue ? 'Overdue' : rentStatus.status === 'paid' ? 'Paid' : 'Pending'}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No rent status available</p>
          )}
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
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
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
    </div>
  );
};

export default PaymentsTab;
