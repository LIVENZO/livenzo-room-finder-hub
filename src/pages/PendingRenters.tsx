import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import ActiveRentersList, { MeterPhoto } from '@/components/dashboard/rent-management/ActiveRentersList';
import AddPaymentModal from '@/components/dashboard/rent-management/AddPaymentModal';
import { getOwnerMeterPhotos } from '@/services/MeterPhotoService';
import { usePropertyScope } from '@/hooks/usePropertyScope';

interface RenterPaymentInfo {
  id: string;
  relationshipId?: string;
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
}

const PendingRenters: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { propertyId, isPrimary } = usePropertyScope();

  const [renters, setRenters] = useState<RenterPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState<{ id: string; name: string } | null>(null);
  const [meterPhotos, setMeterPhotos] = useState<Record<string, MeterPhoto[]>>({});

  useEffect(() => {
    if (user) {
      fetchPendingRenters();
    }
  }, [user, propertyId, isPrimary]);

  const fetchPendingRenters = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let q = supabase
        .from('relationships')
        .select(`id, renter_id`)
        .eq('owner_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (propertyId) {
        q = isPrimary ? q.or(`property_id.eq.${propertyId},property_id.is.null`) : q.eq('property_id', propertyId);
      }

      const { data: relationships, error } = await q;

      if (error) throw error;

      const ownerMeterPhotos = await getOwnerMeterPhotos(user.id);
      setMeterPhotos(ownerMeterPhotos);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const rentersWithStatus = await Promise.all(
        (relationships || []).map(async (rel) => {
          const { data: renterProfile } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url, room_number')
            .eq('id', rel.renter_id)
            .single();

          const { data: recentPayment } = await supabase
            .from('payments')
            .select('payment_date, amount')
            .eq('relationship_id', rel.id)
            .eq('status', 'paid')
            .order('payment_date', { ascending: false })
            .limit(1);

          const { data: rentalAgreement, error: agreementError } = await supabase
            .from('rental_agreements')
            .select('monthly_rent, due_date, status')
            .eq('renter_id', rel.renter_id)
            .eq('owner_id', user?.id)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const currentMonth = new Date().toISOString().slice(0, 7);

          const { data: rentStatus } = await supabase
            .from('rent_status')
            .select('current_amount, status, due_date, billing_month')
            .eq('relationship_id', rel.id)
            .eq('billing_month', currentMonth)
            .maybeSingle();

          const agreementData = !agreementError && rentalAgreement ? rentalAgreement : null;
          const rentAmount = rentStatus?.current_amount || (agreementData as any)?.monthly_rent || 0;
          const dueDate = rentStatus?.due_date || (agreementData as any)?.due_date;
          const paymentStatus: 'paid' | 'unpaid' | 'pending' =
            (rentStatus?.status as any) || 'pending';

          return {
            id: rel.id,
            relationshipId: rel.id,
            renter: {
              id: rel.renter_id,
              full_name: renterProfile?.full_name || 'Unknown Renter',
              avatar_url: renterProfile?.avatar_url,
              room_number: renterProfile?.room_number,
            },
            paymentStatus,
            status: paymentStatus,
            amount: rentAmount,
            dueDate,
            lastPaymentDate: recentPayment?.[0]?.payment_date,
            latestPayment: recentPayment?.[0]
              ? {
                  amount: Number(recentPayment[0].amount),
                  payment_date: recentPayment[0].payment_date,
                  status: 'paid',
                }
              : undefined,
          } as RenterPaymentInfo;
        }),
      );

      // Filter: due date has passed AND not marked as paid
      const overdueUnpaid = rentersWithStatus.filter((r) => {
        if (r.status === 'paid') return false;
        if (!r.dueDate) return false;
        const due = new Date(r.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
      });

      setRenters(overdueUnpaid);
    } catch (error) {
      console.error('Error fetching pending renters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending renters',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = (renterId: string, renterName: string) => {
    setSelectedRenter({ id: renterId, name: renterName });
    setShowAddPayment(true);
  };

  const handlePaymentSaved = () => {
    fetchPendingRenters();
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
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <h1 className="text-2xl font-bold text-foreground">Pending Renters</h1>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                Renters whose due date has passed and rent is not paid
              </p>
            </div>
          </div>
        </div>

        {/* Pending Renters List */}
        <div className="pb-6">
          <ActiveRentersList
            renters={renters}
            loading={loading}
            onAddPayment={handleAddPayment}
            onRefresh={fetchPendingRenters}
            ownerId={user?.id || ''}
            meterPhotos={meterPhotos}
          />
        </div>

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

export default PendingRenters;
