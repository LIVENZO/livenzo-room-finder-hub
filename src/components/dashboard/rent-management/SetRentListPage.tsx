import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, IndianRupee, Shield, Wrench, Home } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SetRentModal from './SetRentModal';
import { usePropertyScope } from '@/hooks/usePropertyScope';

interface Renter {
  id: string;
  full_name: string;
  avatar_url?: string;
  room_number?: string;
  current_rent?: number;
  security_deposit?: number;
  maintenance_amount?: number;
}

interface SetRentListPageProps {
  onBack: () => void;
}

const SetRentListPage: React.FC<SetRentListPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { propertyId, isPrimary, effectiveOwnerId } = usePropertyScope();
  const [renters, setRenters] = useState<Renter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRenter, setSelectedRenter] = useState<Renter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchActiveRenters();
    }
  }, [user, propertyId, isPrimary, effectiveOwnerId]);

  const fetchActiveRenters = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const ownerForQuery = effectiveOwnerId ?? user.id;
      let relQuery = supabase
        .from('relationships')
        .select('renter_id')
        .eq('owner_id', ownerForQuery)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (propertyId) {
        relQuery = isPrimary
          ? relQuery.or(`property_id.eq.${propertyId},property_id.is.null`)
          : relQuery.eq('property_id', propertyId);
      }

      const { data: relationships, error: relationshipsError } = await relQuery;

      if (relationshipsError) {
        console.error('Error fetching relationships:', relationshipsError);
        setError('Unable to load renters. Please check your connection or try again.');
        return;
      }

      if (!relationships || relationships.length === 0) {
        setRenters([]);
        setError(null);
        return;
      }

      const renterIds = relationships.map(r => r.renter_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url, room_number')
        .in('id', renterIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('Unable to load renter details. Please try again.');
        return;
      }

      const { data: rentAgreements, error: rentError } = await supabase
        .from('rental_agreements')
        .select('renter_id, monthly_rent, security_deposit, maintenance_amount')
        .eq('owner_id', ownerForQuery)
        .in('renter_id', renterIds)
        .eq('status', 'active');

      if (rentError) {
        console.error('Error fetching rent agreements:', rentError);
      }

      const renterData: Renter[] = profiles
        ?.filter(profile => profile.full_name && profile.full_name !== 'Unknown Renter')
        .map(profile => {
          const rentAgreement = rentAgreements?.find(ra => ra.renter_id === profile.id);
          return {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url || '',
            room_number: profile.room_number || '',
            current_rent: rentAgreement?.monthly_rent || 0,
            security_deposit: (rentAgreement as any)?.security_deposit || 0,
            maintenance_amount: (rentAgreement as any)?.maintenance_amount || 0
          };
        }) || [];

      setRenters(renterData);
      setError(null);
    } catch (error) {
      console.error('Error fetching active renters:', error);
      setError('Unable to load renters. Please check your connection or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetRent = (renter: Renter) => {
    setSelectedRenter(renter);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRenter(null);
  };

  const handleRentSuccess = (renterId: string, newRent: number) => {
    setRenters(prev => prev.map(r =>
      r.id === renterId
        ? { ...r, current_rent: newRent }
        : r
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Set Monthly Rent</h1>
            <p className="text-muted-foreground">Loading renters...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Set Monthly Rent</h1>
            <p className="text-muted-foreground">Manage rent amounts for your renters</p>
          </div>
        </div>
        <Card className="text-center py-16 border-destructive/20">
          <CardContent className="space-y-6">
            <div className="h-20 w-20 bg-destructive/10 rounded-full mx-auto flex items-center justify-center">
              <Users className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Unable to Load Renters</h3>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">{error}</p>
            </div>
            <Button onClick={fetchActiveRenters} className="min-w-[120px]" disabled={loading}>
              {loading ? 'Loading...' : 'Try Again'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (renters.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Set Monthly Rent</h1>
            <p className="text-muted-foreground">Manage rent amounts for your renters</p>
          </div>
        </div>
        <Card className="text-center py-16">
          <CardContent className="space-y-6">
            <Users className="h-20 w-20 text-muted-foreground mx-auto opacity-50" />
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">No Renters Connected</h3>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                No renters connected yet. Please connect renters to manage rent.
              </p>
            </div>
            <Button onClick={fetchActiveRenters} variant="outline" className="min-w-[120px]" disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Set Monthly Rent</h1>
          <p className="text-muted-foreground">Manage rent amounts for your renters</p>
        </div>
      </div>

      <div className="space-y-4">
        {renters.map((renter) => (
          <Card key={renter.id} className="transition-all duration-200 hover:shadow-md">
            <CardContent className="p-4 sm:p-6">
              {/* Top row: avatar + info + action button */}
              <div className="flex items-start gap-3 sm:gap-4">
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
                  <AvatarImage src={renter.avatar_url} alt={renter.full_name} />
                  <AvatarFallback className="text-base sm:text-lg font-semibold">
                    {renter.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">{renter.full_name}</h3>
                  {renter.room_number && (
                    <p className="text-xs sm:text-sm text-muted-foreground">Room No: {renter.room_number}</p>
                  )}
                </div>

                <Button
                  onClick={() => handleSetRent(renter)}
                  className="min-w-[90px] sm:min-w-[100px] bg-primary hover:bg-primary/90 text-xs sm:text-sm flex-shrink-0"
                >
                  <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  Set Rent
                </Button>
              </div>

              {/* Financial Details — full width, clean mini cards */}
              <div className="mt-3 pt-3 border-t border-border/40">
                <div className="grid grid-cols-3 gap-2">
                  {/* Monthly Rent */}
                  <div className="flex flex-col items-center gap-1 bg-muted/40 rounded-xl px-1.5 py-2 min-w-0">
                    <div className="flex items-center justify-center gap-1">
                      <Home className="h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Rent</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-full">
                      {renter.current_rent && renter.current_rent > 0 ? `₹${renter.current_rent.toLocaleString()}` : '—'}
                    </span>
                  </div>
                  {/* Security Deposit */}
                  <div className="flex flex-col items-center gap-1 bg-muted/40 rounded-xl px-1.5 py-2 min-w-0">
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-emerald-600/80 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Deposit</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-full">
                      {renter.security_deposit && renter.security_deposit > 0 ? `₹${renter.security_deposit.toLocaleString()}` : '—'}
                    </span>
                  </div>
                  {/* Maintenance */}
                  <div className="flex flex-col items-center gap-1 bg-muted/40 rounded-xl px-1.5 py-2 min-w-0">
                    <div className="flex items-center justify-center gap-1">
                      <Wrench className="h-3.5 w-3.5 text-amber-600/80 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Maint.</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-full">
                      {renter.maintenance_amount && renter.maintenance_amount > 0 ? `₹${renter.maintenance_amount.toLocaleString()}` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SetRentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        renter={selectedRenter}
        onSuccess={handleRentSuccess}
      />
    </div>
  );
};

export default SetRentListPage;
