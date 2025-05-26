
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface RenterPaymentsProps {
  relationshipId: string;
}

const RenterPayments: React.FC<RenterPaymentsProps> = ({ relationshipId }) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Mock data for now - replace with real data later
  const [currentRent] = useState({
    amount: 1200,
    dueDate: '2024-02-01',
    status: 'pending'
  });

  const [paymentHistory] = useState([
    {
      id: '1',
      amount: 1200,
      date: '2024-01-01',
      status: 'paid',
      method: 'UPI',
      transactionId: 'TXN123456'
    },
    {
      id: '2',
      amount: 1200,
      date: '2023-12-01',
      status: 'paid',
      method: 'Bank Transfer',
      transactionId: 'TXN123455'
    },
    {
      id: '3',
      amount: 1200,
      date: '2023-11-01',
      status: 'paid',
      method: 'Cash',
      transactionId: null
    }
  ]);

  const handlePayRent = async () => {
    setIsProcessingPayment(true);
    
    try {
      // TODO: Implement actual payment processing
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock payment processing
      
      toast.success('Payment processed successfully');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default' as const;
      case 'pending':
        return 'secondary' as const;
      case 'overdue':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  const isOverdue = new Date(currentRent.dueDate) < new Date() && currentRent.status !== 'paid';

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
              <p className="text-2xl font-bold">${currentRent.amount}</p>
              <div className="flex items-center gap-2 mt-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Due: {new Date(currentRent.dueDate).toLocaleDateString()}
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
                variant={getStatusVariant(isOverdue ? 'overdue' : currentRent.status)}
                className="mb-3 flex items-center gap-1 w-fit ml-auto"
              >
                {getStatusIcon(isOverdue ? 'overdue' : currentRent.status)}
                {isOverdue ? 'Overdue' : currentRent.status}
              </Badge>
              
              {currentRent.status === 'pending' && (
                <Button 
                  onClick={handlePayRent}
                  disabled={isProcessingPayment}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  {isProcessingPayment ? 'Processing...' : 'Pay Now'}
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
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">${payment.amount}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.date).toLocaleDateString()} • {payment.method}
                      </p>
                      {payment.transactionId && (
                        <p className="text-xs text-gray-400">
                          ID: {payment.transactionId}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant={getStatusVariant(payment.status)}>
                    {payment.status}
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

export default RenterPayments;
