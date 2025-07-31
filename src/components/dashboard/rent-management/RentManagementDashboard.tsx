import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RentSummaryCards from './RentSummaryCards';
import ActiveRentersList from './ActiveRentersList';
import AddPaymentModal from './AddPaymentModal';

interface RentStats {
  totalReceived: number;
  thisMonth: number;
  pendingAmount: number;
  activeRenters: number;
}

interface RenterPaymentInfo {
  id: string;
  renter: {
    id: string;
    full_name: string;
    avatar_url?: string;
    room_number?: string;
  };
  paymentStatus: 'paid' | 'unpaid' | 'pending';
  amount: number;
  dueDate?: string;
  lastPaymentDate?: string;
}

const RentManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<RentStats>({
    totalReceived: 0,
    thisMonth: 0,
    pendingAmount: 0,
    activeRenters: 0
  });
  
  const [renters, setRenters] = useState<RenterPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState<{id: string, name: string} | null>(null);
  const [showActiveRenters, setShowActiveRenters] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchActiveRenters()
      ]);
    } catch (error) {
      console.error('Error fetching rent management data:', error);
      toast({
        title: "Error",
        description: "Failed to load rent management data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get all payments for this owner
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_date,
          status,
          relationships!inner(owner_id)
        `)
        .eq('relationships.owner_id', user?.id);

      if (paymentsError) throw paymentsError;

      // Get rent statuses for pending amounts
      const { data: rentStatuses, error: rentError } = await supabase
        .from('rent_status')
        .select(`
          current_amount,
          status,
          relationships!inner(owner_id)
        `)
        .eq('relationships.owner_id', user?.id)
        .neq('status', 'paid');

      if (rentError) throw rentError;

      // Get active renters count
      const { data: relationships, error: relationshipsError } = await supabase
        .from('relationships')
        .select('id')
        .eq('owner_id', user?.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (relationshipsError) throw relationshipsError;

      // Calculate stats
      const totalReceived = payments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = payments
        ?.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return p.status === 'paid' && 
                 paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const pendingAmount = rentStatuses
        ?.reduce((sum, r) => sum + Number(r.current_amount), 0) || 0;

      setStats({
        totalReceived,
        thisMonth,
        pendingAmount,
        activeRenters: relationships?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchActiveRenters = async () => {
    try {
      const { data: relationships, error } = await supabase
        .from('relationships')
        .select(`
          id,
          renter_id
        `)
        .eq('owner_id', user?.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (error) throw error;

      // For each renter, get their current rent status
      const rentersWithStatus = await Promise.all(
        (relationships || []).map(async (rel) => {
          // Get renter profile
          const { data: renterProfile } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url, room_number')
            .eq('id', rel.renter_id)
            .single();

          // Check for recent payments
          const { data: recentPayment } = await supabase
            .from('payments')
            .select('payment_date, amount')
            .eq('renter_id', rel.renter_id)
            .eq('status', 'paid')
            .order('payment_date', { ascending: false })
            .limit(1);

          // Check rent status
          const { data: rentStatus } = await supabase
            .from('rent_status')
            .select('current_amount, status, due_date')
            .eq('relationship_id', rel.id)
            .limit(1);

          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const hasRecentPayment = recentPayment?.[0] && 
            new Date(recentPayment[0].payment_date).getMonth() === currentMonth &&
            new Date(recentPayment[0].payment_date).getFullYear() === currentYear;

          const paymentStatus: 'paid' | 'unpaid' | 'pending' = hasRecentPayment ? 'paid' : 
                        rentStatus?.[0]?.status === 'pending' ? 'pending' : 'unpaid';

          return {
            id: rel.id,
            renter: {
              id: rel.renter_id,
              full_name: renterProfile?.full_name || 'Unknown Renter',
              avatar_url: renterProfile?.avatar_url,
              room_number: renterProfile?.room_number
            },
            paymentStatus,
            amount: rentStatus?.[0]?.current_amount || 25000, // Default amount
            dueDate: rentStatus?.[0]?.due_date,
            lastPaymentDate: recentPayment?.[0]?.payment_date
          };
        })
      );

      setRenters(rentersWithStatus);
    } catch (error) {
      console.error('Error fetching active renters:', error);
    }
  };

  const handleCardClick = (type: 'total' | 'month' | 'pending' | 'renters') => {
    if (type === 'renters') {
      setShowActiveRenters(true);
    }
    // Add more actions for other cards if needed
  };

  const handleAddPayment = (renterId: string) => {
    const renter = renters.find(r => r.renter.id === renterId);
    if (renter) {
      setSelectedRenter({
        id: renterId,
        name: renter.renter.full_name
      });
      setShowAddPayment(true);
    }
  };

  const handleSavePayment = async (payment: {
    amount: number;
    paymentDate: Date;
    renterId: string;
  }) => {
    try {
      // Find the relationship for this renter
      const relationship = renters.find(r => r.renter.id === payment.renterId);
      if (!relationship) {
        throw new Error('Relationship not found');
      }

      // Insert payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          amount: payment.amount,
          renter_id: payment.renterId,
          owner_id: user?.id,
          relationship_id: relationship.id,
          payment_date: payment.paymentDate.toISOString(),
          payment_method: 'manual',
          status: 'paid',
          property_id: crypto.randomUUID() // Temporary property ID
        });

      if (paymentError) throw paymentError;

      // Update rent status to paid
      const { error: rentError } = await supabase
        .from('rent_status')
        .upsert({
          relationship_id: relationship.id,
          current_amount: payment.amount,
          status: 'paid',
          due_date: new Date(payment.paymentDate.getFullYear(), payment.paymentDate.getMonth() + 1, 1).toISOString()
        });

      if (rentError) throw rentError;

      toast({
        title: "Payment Added",
        description: `Payment of ₹${payment.amount.toLocaleString()} added successfully!`
      });

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: "Error",
        description: "Failed to save payment. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <RentSummaryCards
        stats={stats}
        loading={loading}
        onCardClick={handleCardClick}
      />

      {/* Active Renters List */}
      {(showActiveRenters || stats.activeRenters > 0) && (
        <ActiveRentersList
          renters={renters}
          loading={loading}
          onAddPayment={handleAddPayment}
        />
      )}

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={showAddPayment}
        onClose={() => {
          setShowAddPayment(false);
          setSelectedRenter(null);
        }}
        onSave={handleSavePayment}
        renterName={selectedRenter?.name || ''}
        renterId={selectedRenter?.id || ''}
        loading={loading}
      />
    </div>
  );
};

export default RentManagementDashboard;