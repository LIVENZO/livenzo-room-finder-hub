import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import ActiveRentersList from '@/components/dashboard/rent-management/ActiveRentersList';
import AddPaymentModal from '@/components/dashboard/rent-management/AddPaymentModal';

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

const ActiveRenters: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [renters, setRenters] = useState<RenterPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (user) {
      fetchActiveRenters();
    }
  }, [user]);

  const fetchActiveRenters = async () => {
    setLoading(true);
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

          // Check rental agreement for amount and due date
          const { data: rentalAgreement, error: agreementError } = await supabase
            .from('rental_agreements')
            .select('monthly_rent, due_date, status')
            .eq('renter_id', rel.renter_id)
            .eq('owner_id', user?.id)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Fallback to rent_status if no rental agreement
          const { data: rentStatus, error: rentError } = await supabase
            .from('rent_status')
            .select('current_amount, status, due_date')
            .eq('relationship_id', rel.id)
            .limit(1);

          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const hasRecentPayment = recentPayment?.[0] && 
            new Date(recentPayment[0].payment_date).getMonth() === currentMonth &&
            new Date(recentPayment[0].payment_date).getFullYear() === currentYear;

          // Safely extract data, handling potential errors
          const agreementData = !agreementError && rentalAgreement ? rentalAgreement : null;
          const statusData = !rentError && rentStatus?.[0] ? rentStatus[0] : null;
          
          // Use rental agreement data first, fallback to rent_status
          const rentAmount = (agreementData as any)?.monthly_rent || statusData?.current_amount || 0;
          const dueDate = (agreementData as any)?.due_date || statusData?.due_date;
          const rentStatusValue = (agreementData as any)?.status || statusData?.status;
          
          const paymentStatus: 'paid' | 'unpaid' | 'pending' = hasRecentPayment ? 'paid' : 
                        rentStatusValue === 'pending' ? 'pending' : 'unpaid';

          return {
            id: rel.id,
            renter: {
              id: rel.renter_id,
              full_name: renterProfile?.full_name || 'Unknown Renter',
              avatar_url: renterProfile?.avatar_url,
              room_number: renterProfile?.room_number
            },
            paymentStatus,
            amount: rentAmount,
            dueDate: dueDate,
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
      toast({
        title: "Error",
        description: "Failed to load active renters data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
    fetchActiveRenters();
    setShowAddPayment(false);
    setSelectedRenter(null);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-background border-b border-border/50 px-4 py-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted/80 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Active Renters</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Manage rent payments for your connected renters
              </p>
            </div>
          </div>
        </div>

        {/* Active Renters List - Full width */}
        <div className="pb-6">
          <ActiveRentersList
            renters={renters}
            loading={loading}
            onAddPayment={handleAddPayment}
            onRefresh={fetchActiveRenters}
          />
        </div>

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
    </Layout>
  );
};

export default ActiveRenters;