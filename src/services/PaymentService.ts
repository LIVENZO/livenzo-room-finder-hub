
import { supabase } from '@/integrations/supabase/client';

export interface Payment {
  id: string;
  renter_id: string;
  owner_id: string;
  relationship_id: string;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  due_date: string | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentStatus {
  id: string;
  relationship_id: string;
  current_amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  last_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchRentStatus = async (relationshipId: string): Promise<RentStatus | null> => {
  const { data, error } = await supabase
    .from('rent_status')
    .select('*')
    .eq('relationship_id', relationshipId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching rent status:', error);
    throw error;
  }

  return data as RentStatus | null;
};

export const fetchPaymentHistory = async (relationshipId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('relationship_id', relationshipId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }

  return (data || []) as Payment[];
};

export const createPayment = async (paymentData: {
  relationship_id: string;
  owner_id: string;
  amount: number;
  payment_method: string;
  due_date?: string;
}): Promise<Payment> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      renter_id: user.id,
      owner_id: paymentData.owner_id,
      relationship_id: paymentData.relationship_id,
      amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      payment_status: 'pending' as const,
      due_date: paymentData.due_date || null,
      payment_date: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    throw error;
  }

  return data as Payment;
};

export const updatePaymentStatus = async (
  paymentId: string,
  status: 'completed' | 'failed' | 'cancelled',
  razorpayPaymentId?: string,
  transactionId?: string
): Promise<void> => {
  const updateData: any = {
    payment_status: status,
    updated_at: new Date().toISOString()
  };

  if (razorpayPaymentId) {
    updateData.razorpay_payment_id = razorpayPaymentId;
  }

  if (transactionId) {
    updateData.transaction_id = transactionId;
  }

  if (status === 'completed') {
    updateData.payment_date = new Date().toISOString();
  }

  const { error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', paymentId);

  if (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

export const updateRentStatus = async (
  relationshipId: string,
  status: 'pending' | 'paid' | 'overdue',
  lastPaymentId?: string
): Promise<void> => {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (lastPaymentId) {
    updateData.last_payment_id = lastPaymentId;
  }

  const { error } = await supabase
    .from('rent_status')
    .upsert(updateData)
    .eq('relationship_id', relationshipId);

  if (error) {
    console.error('Error updating rent status:', error);
    throw error;
  }
};

export const initializeRentStatus = async (
  relationshipId: string,
  amount: number = 1200,
  dueDate: string = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
): Promise<void> => {
  const { error } = await supabase
    .from('rent_status')
    .upsert({
      relationship_id: relationshipId,
      current_amount: amount,
      due_date: dueDate,
      status: 'pending' as const
    });

  if (error) {
    console.error('Error initializing rent status:', error);
    throw error;
  }
};
