
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

const PaymentsTab: React.FC = () => {
  // Mock data for payments - replace with real data
  const mockPayments = [
    { id: '1', amount: 1200, date: '2024-01-01', status: 'Paid', transactionId: 'TXN001' },
    { id: '2', amount: 1200, date: '2024-02-01', status: 'Pending', transactionId: null },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Rent Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockPayments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">${payment.amount}</p>
                <p className="text-sm text-gray-500">
                  Due: {payment.date}
                  {payment.transactionId && ` • ID: ${payment.transactionId}`}
                </p>
              </div>
              <Badge variant={payment.status === 'Paid' ? 'default' : 'destructive'}>
                {payment.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentsTab;
