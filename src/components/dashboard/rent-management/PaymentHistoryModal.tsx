import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { format, subMonths } from 'date-fns';

interface PaymentHistoryRecord {
  id: string;
  billing_month: string;
  status: 'paid' | 'unpaid' | 'pending';
  amount: number;
  payment_date: string;
  payment_method?: string;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  renterId: string;
  renterName: string;
  ownerId: string;
  relationshipId: string;
  currentAmount: number;
}

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  renterId,
  renterName,
  ownerId,
  relationshipId,
  currentAmount
}) => {
  const [history, setHistory] = useState<PaymentHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentHistory();
    }
  }, [isOpen, renterId]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payments')
        .select('id, billing_month, status, amount, payment_date, payment_method')
        .eq('renter_id', renterId)
        .eq('owner_id', ownerId)
        .order('billing_month', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        throw error;
      }

      const typedHistory: PaymentHistoryRecord[] = (data || []).map(payment => ({
        id: payment.id,
        billing_month: payment.billing_month || '',
        status: (payment.status === 'paid' || payment.status === 'unpaid' || payment.status === 'pending') 
          ? payment.status 
          : 'pending',
        amount: Number(payment.amount),
        payment_date: payment.payment_date || '',
        payment_method: payment.payment_method || undefined
      }));

      setHistory(typedHistory);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Paid</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unpaid':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Group payments by month
  const groupedPayments = history.reduce((acc, payment) => {
    const month = payment.billing_month;
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(payment);
    return acc;
  }, {} as Record<string, PaymentHistoryRecord[]>);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-left">
            <Calendar className="h-5 w-5" />
            Payment History - {renterName}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          {loading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No payment history available yet</h3>
              <p className="text-sm text-muted-foreground">
                Payment records will appear here once they are created
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {Object.entries(groupedPayments)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, payments]) => {
                  const payment = payments[0]; // Get the first payment for this month
                  const isCurrentMonth = month === format(new Date(), 'yyyy-MM');
                  
                  return (
                    <div
                      key={month}
                      className={`p-4 rounded-lg border ${
                        isCurrentMonth 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {format(new Date(month + '-01'), 'MMMM yyyy')}
                            </h3>
                            {isCurrentMonth && (
                              <Badge variant="outline" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Amount: ₹{payment.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                      
                      {payment.payment_date && payment.status === 'paid' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <p className="text-xs text-muted-foreground">
                            Paid on {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                      
                      {payment.payment_method && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Method: {payment.payment_method.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentHistoryModal;
