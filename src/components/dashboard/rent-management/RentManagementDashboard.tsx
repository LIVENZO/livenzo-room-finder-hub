import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RentSummaryCards from './RentSummaryCards';
import SetRentListPage from './SetRentListPage';
import ActiveRentersList, { MeterPhoto } from './ActiveRentersList';
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
  status: 'paid' | 'unpaid' | 'pending';
  amount: number;
  dueDate?: string;
  lastPaymentDate?: string;
  latestPayment?: {
    amount: number;
    payment_date: string;
    status: string;
  };
  relationshipId?: string;
  meterPhotos?: MeterPhoto[];
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
  const [renters, setRenters] = useState<RenterPaymentInfo[]>([]);
  const [meterPhotos, setMeterPhotos] = useState<Record<string, MeterPhoto[]>>({});
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRenters();
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

  const fetchRenters = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch active relationships
      const { data: relationships, error: relError } = await supabase
        .from('relationships')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (relError) throw relError;

      // Fetch meter photos for this owner
      const { data: photos, error: photosError } = await supabase
        .from('meter_photos')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      // Group photos by relationship_id
      const photosByRelationship: Record<string, MeterPhoto[]> = {};
      photos?.forEach(photo => {
        if (!photosByRelationship[photo.relationship_id]) {
          photosByRelationship[photo.relationship_id] = [];
        }
        photosByRelationship[photo.relationship_id].push(photo);
      });
      setMeterPhotos(photosByRelationship);

      // Fetch renter details and payment info
      const rentersData: RenterPaymentInfo[] = await Promise.all(
        relationships?.map(async (rel) => {
          // Fetch renter profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, full_name, avatar_url, room_number')
            .eq('id', rel.renter_id)
            .single();

          // Fetch recent payments
          const { data: recentPayment } = await supabase
            .from('payments')
            .select('amount, payment_date, status')
            .eq('relationship_id', rel.id)
            .order('payment_date', { ascending: false })
            .limit(1)
            .single();

          // Fetch rent status
          const { data: rentStatus } = await supabase
            .from('rent_status')
            .select('*')
            .eq('relationship_id', rel.id)
            .single();

          // Fetch rental agreement for rent amount
          const { data: agreement } = await supabase
            .from('rental_agreements')
            .select('monthly_rent, due_date')
            .eq('owner_id', user.id)
            .eq('renter_id', rel.renter_id)
            .eq('status', 'active')
            .single();

          const amount = rentStatus?.current_amount || agreement?.monthly_rent || 0;
          const dueDate = rentStatus?.due_date || agreement?.due_date;
          const paymentStatus = rentStatus?.status || 'pending';

          return {
            id: rel.renter_id,
            renter: {
              id: profile?.id || rel.renter_id,
              full_name: profile?.full_name || 'Unknown',
              avatar_url: profile?.avatar_url,
              room_number: profile?.room_number,
            },
            paymentStatus: paymentStatus as 'paid' | 'unpaid' | 'pending',
            status: paymentStatus as 'paid' | 'unpaid' | 'pending',
            amount: Number(amount),
            dueDate: dueDate,
            lastPaymentDate: recentPayment?.payment_date,
            latestPayment: recentPayment,
            relationshipId: rel.id,
            meterPhotos: photosByRelationship[rel.id] || [],
          };
        }) || []
      );

      setRenters(rentersData);
    } catch (error) {
      console.error('Error fetching renters:', error);
      toast.error('Failed to load renters');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = (renterId: string, renterName: string) => {
    setSelectedRenter({ id: renterId, name: renterName });
    setShowAddPaymentModal(true);
  };

  const handlePaymentSaved = () => {
    setShowAddPaymentModal(false);
    setSelectedRenter(null);
    fetchRenters();
    fetchStats();
  };

  const handleBackFromSetRent = () => {
    setShowSetRentPage(false);
    fetchStats();
    fetchRenters();
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

      {/* Active Renters List */}
      <ActiveRentersList
        renters={renters}
        loading={loading}
        onAddPayment={handleAddPayment}
        meterPhotos={meterPhotos}
        onRefresh={fetchRenters}
        ownerId={user?.id || ''}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={showAddPaymentModal && !!selectedRenter}
        renterId={selectedRenter?.id || ''}
        renterName={selectedRenter?.name || ''}
        ownerId={user?.id || ''}
        onClose={() => {
          setShowAddPaymentModal(false);
          setSelectedRenter(null);
        }}
        onPaymentSaved={handlePaymentSaved}
      />
    </div>
  );
};

export default RentManagementDashboard;