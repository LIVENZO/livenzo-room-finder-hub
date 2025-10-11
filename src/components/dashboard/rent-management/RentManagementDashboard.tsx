import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RentSummaryCards from './RentSummaryCards';
import SetRentListPage from './SetRentListPage';

interface RentStats {
  totalReceived: number;
  thisMonth: number;
  pendingAmount: number;
  activeRenters: number;
}


const RentManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState<RentStats>({
    totalReceived: 0,
    thisMonth: 0,
    pendingAmount: 0,
    activeRenters: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [showSetRentPage, setShowSetRentPage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);


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
      toast.error('Failed to load rent management data');
    }
  };

  const handleCardClick = (type: 'total' | 'month' | 'pending' | 'renters' | 'setrent') => {
    if (type === 'renters') {
      navigate('/active-renters');
    } else if (type === 'setrent') {
      setShowSetRentPage(true);
    }
    // Add more actions for other cards if needed
  };

  const handleBackFromSetRent = () => {
    setShowSetRentPage(false);
    fetchStats();
  };

  if (showSetRentPage) {
    return <SetRentListPage onBack={handleBackFromSetRent} />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <RentSummaryCards
        stats={stats}
        loading={loading}
        onCardClick={handleCardClick}
      />
    </div>
  );
};

export default RentManagementDashboard;