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
  latestPayment?: {
    amount: number;
    payment_date: string;
    status: string;
  };
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
            lastPaymentDate: recentPayment?.[0]?.payment_date,
            latestPayment: recentPayment?.[0] ? {
              amount: Number(recentPayment[0].amount),
              payment_date: recentPayment[0].payment_date,
              status: 'paid'
            } : undefined
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

  const handleAddPayment = (renterId: string, renterName: string) => {
    setSelectedRenter({
      id: renterId,
      name: renterName
    });
    setShowAddPayment(true);
  };

  const handlePaymentSaved = () => {
    // Refresh the data after payment is saved
    fetchData();
    setShowAddPayment(false);
    setSelectedRenter(null);
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
      {selectedRenter && (
        <AddPaymentModal
          isOpen={showAddPayment}
          onClose={() => {
            setShowAddPayment(false);
            setSelectedRenter(null);
          }}
          renterName={selectedRenter.name}
          renterId={selectedRenter.id}
          ownerId={user?.id || ''}
          onPaymentSaved={handlePaymentSaved}
        />
      )}
    </div>
  );
};

export default RentManagementDashboard;