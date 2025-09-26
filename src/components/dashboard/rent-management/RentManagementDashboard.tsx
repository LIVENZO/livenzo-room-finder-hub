import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ActiveRentersList, { MeterPhoto } from './ActiveRentersList';
import RentSummaryCards from './RentSummaryCards';
import AddPaymentModal from './AddPaymentModal';
import SetRentModal from './SetRentModal';
import { getOwnerMeterPhotos } from '@/services/MeterPhotoService';

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
  relationshipId?: string;
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
  
  const [renters, setRenters] = useState<RenterPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showSetRentModal, setShowSetRentModal] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState<{ id: string; name: string } | null>(null);
  const [meterPhotos, setMeterPhotos] = useState<Record<string, MeterPhoto[]>>({});

  useEffect(() => {
    if (user) {
      fetchRenters();
      fetchStats();
    }
  }, [user]);

  const fetchRenters = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // First get all relationships for this owner
      const { data: relationships, error: relationshipsError } = await supabase
        .from('relationships')
        .select(`
          id,
          renter_id,
          status,
          created_at
        `)
        .eq('owner_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (relationshipsError) {
        console.error('Error fetching relationships:', relationshipsError);
        toast.error('Failed to load relationships');
        return;
      }

      // Fetch meter photos for this owner
      const ownerMeterPhotos = await getOwnerMeterPhotos(user.id);
      setMeterPhotos(ownerMeterPhotos);

      if (!relationships || relationships.length === 0) {
        setRenters([]);
        return;
      }

      // Get renter IDs
      const renterIds = relationships.map(r => r.renter_id);

      // Fetch renter profiles
      const { data: renterProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url, room_number')
        .in('id', renterIds);

      if (profilesError) {
        console.error('Error fetching renter profiles:', profilesError);
        toast.error('Failed to load renter profiles');
        return;
      }

      // Fetch rent statuses
      const { data: rentStatuses, error: rentError } = await supabase
        .from('rent_status')
        .select('*')
        .in('relationship_id', relationships.map(r => r.id));

      if (rentError) {
        console.error('Error fetching rent statuses:', rentError);
      }

      // Fetch latest payments
      const { data: latestPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('renter_id', renterIds)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      }

      // Combine data
      const renterPaymentInfo: RenterPaymentInfo[] = relationships.map(relationship => {
        const renterProfile = renterProfiles?.find(p => p.id === relationship.renter_id);
        const rentStatus = rentStatuses?.find(r => r.relationship_id === relationship.id);
        const renterPayments = latestPayments?.filter(p => p.renter_id === relationship.renter_id) || [];
        const latestPayment = renterPayments[0];

        return {
          id: relationship.id,
          renter: {
            id: relationship.renter_id,
            full_name: renterProfile?.full_name || 'Unknown Renter',
            avatar_url: renterProfile?.avatar_url || '',
            room_number: renterProfile?.room_number || ''
          },
          relationshipId: relationship.id,
          paymentStatus: rentStatus?.status === 'paid' ? 'paid' : 'unpaid',
          amount: rentStatus?.current_amount || 0,
          dueDate: rentStatus?.due_date,
          lastPaymentDate: latestPayment?.payment_date,
          latestPayment: latestPayment ? {
            amount: latestPayment.amount,
            payment_date: latestPayment.payment_date,
            status: latestPayment.status
          } : undefined
        };
      });

      setRenters(renterPaymentInfo);
    } catch (error) {
      console.error('Error in fetchRenters:', error);
      toast.error('Failed to load renters data');
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
      toast.error('Failed to load rent management data');
    }
  };

  const handleCardClick = (type: 'total' | 'month' | 'pending' | 'renters') => {
    if (type === 'renters') {
      navigate('/active-renters');
    }
    // Add more actions for other cards if needed
  };

  const handleAddPayment = (renterId: string, renterName: string) => {
    setSelectedRenter({ id: renterId, name: renterName });
    setShowAddPaymentModal(true);
  };

  const handlePaymentAdded = () => {
    setShowAddPaymentModal(false);
    setSelectedRenter(null);
    fetchRenters();
    fetchStats();
    toast.success('Payment added successfully!');
  };

  const handleSetRentClick = () => {
    setShowSetRentModal(true);
  };

  const handleRentSet = () => {
    setShowSetRentModal(false);
    fetchRenters();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <RentSummaryCards
        stats={stats}
        loading={loading}
        onCardClick={handleCardClick}
        onSetRentClick={handleSetRentClick}
      />

      {/* Active Renters List */}
      <div className="bg-card rounded-lg shadow-sm border border-border/50 overflow-hidden">
        <div className="px-4 py-6 border-b border-border/50">
          <h3 className="text-lg font-semibold text-foreground">Active Renters</h3>
          <p className="text-sm text-muted-foreground">Manage rent payments and meter photos</p>
        </div>
        
        <ActiveRentersList 
          renters={renters}
          loading={loading}
          onAddPayment={handleAddPayment}
          meterPhotos={meterPhotos}
        />
      </div>

      {/* Add Payment Modal */}
      {showAddPaymentModal && selectedRenter && user?.id && (
        <AddPaymentModal
          isOpen={showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(false)}
          renterName={selectedRenter.name}
          renterId={selectedRenter.id}
          ownerId={user.id}
          onPaymentSaved={handlePaymentAdded}
        />
      )}

      {/* Set Rent Modal */}
      <SetRentModal
        isOpen={showSetRentModal}
        onClose={() => setShowSetRentModal(false)}
        onRentSet={handleRentSet}
      />
    </div>
  );
};

export default RentManagementDashboard;