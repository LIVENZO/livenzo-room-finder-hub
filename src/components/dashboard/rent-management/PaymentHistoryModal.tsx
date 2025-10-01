import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth } from 'date-fns';

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
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const [updating, setUpdating] = useState<string | null>(null);

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
        .select('*')
        .eq('renter_id', renterId)
        .eq('owner_id', ownerId)
        .order('billing_month', { ascending: false })
        .limit(12); // Last 12 months

      if (error) throw error;

      // Map to the expected type, ensuring status is properly typed
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

  const updatePaymentStatus = async (monthString: string, newStatus: 'paid' | 'unpaid' | 'pending') => {
    try {
      setUpdating(monthString);

      // Check if payment record exists for this month
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('renter_id', renterId)
        .eq('owner_id', ownerId)
        .eq('billing_month', monthString)
        .maybeSingle();

      if (existingPayment) {
        // Update existing record
        const { error } = await supabase
          .from('payments')
          .update({
            status: newStatus,
            payment_date: newStatus === 'paid' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id);

        if (error) throw error;
      } else {
        // Create new record for this month
        const { error } = await supabase
          .from('payments')
          .insert({
            renter_id: renterId,
            owner_id: ownerId,
            relationship_id: relationshipId,
            billing_month: monthString,
            amount: currentAmount,
            status: newStatus,
            payment_date: newStatus === 'paid' ? new Date().toISOString() : null,
            payment_method: 'manual_update',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success(`Payment status updated to ${newStatus}`);
      await fetchPaymentHistory();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast.error(error?.message || 'Failed to update payment status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'unpaid':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            Paid
          </Badge>
        );
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getMonthStatus = (monthString: string): 'paid' | 'unpaid' | 'pending' => {
    const record = history.find(h => h.billing_month === monthString);
    return record?.status || 'pending';
  };

  const generateMonthsList = () => {
    const months: Date[] = [];
    const currentDate = new Date();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      months.push(subMonths(currentDate, i));
    }
    
    return months;
  };

  const months = generateMonthsList();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payment History - {renterName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="h-12 w-24 bg-muted-foreground/20 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted-foreground/20 rounded w-1/3"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {months.map((month) => {
                const monthString = format(month, 'yyyy-MM');
                const status = getMonthStatus(monthString);
                const record = history.find(h => h.billing_month === monthString);
                const isCurrentMonth = monthString === format(new Date(), 'yyyy-MM');
                const isUpdating = updating === monthString;

                return (
                  <div
                    key={monthString}
                    className={`p-4 rounded-lg border transition-colors ${
                      isCurrentMonth 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold text-base">
                            {format(month, 'MMMM yyyy')}
                            {isCurrentMonth && (
                              <span className="ml-2 text-xs text-primary font-normal">(Current)</span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Amount: ₹{record?.amount || currentAmount}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        {getStatusBadge(status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={status === 'paid' ? 'default' : 'outline'}
                        onClick={() => updatePaymentStatus(monthString, 'paid')}
                        disabled={isUpdating || status === 'paid'}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {status === 'paid' ? 'Paid' : 'Mark Paid'}
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'unpaid' ? 'destructive' : 'outline'}
                        onClick={() => updatePaymentStatus(monthString, 'unpaid')}
                        disabled={isUpdating || status === 'unpaid'}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {status === 'unpaid' ? 'Unpaid' : 'Mark Unpaid'}
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'pending' ? 'secondary' : 'outline'}
                        onClick={() => updatePaymentStatus(monthString, 'pending')}
                        disabled={isUpdating || status === 'pending'}
                        className="flex-1"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        {status === 'pending' ? 'Pending' : 'Mark Pending'}
                      </Button>
                    </div>

                    {record?.payment_date && status === 'paid' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Paid on: {format(new Date(record.payment_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHistoryModal;
