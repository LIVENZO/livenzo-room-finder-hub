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
      // Get all active relationships for this owner, scoped to active property
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

      // Get renter profiles
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

      // Get current rent amounts from rental agreements
      const { data: rentAgreements, error: rentError } = await supabase
        .from('rental_agreements')
        .select('renter_id, monthly_rent, security_deposit, maintenance_amount')
        .eq('owner_id', ownerForQuery)
        .in('renter_id', renterIds)
        .eq('status', 'active');

      if (rentError) {
        console.error('Error fetching rent agreements:', rentError);
        // Don't show error for rent agreements as it's not critical
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
    // Update the renter's current rent in state
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

  // Show error state if there's an error
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
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                {error}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={fetchActiveRenters}
                className="min-w-[120px]"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Try Again'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  }

  return (
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
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={renter.avatar_url} alt={renter.full_name} />
                  <AvatarFallback className="text-lg font-semibold">
                    {renter.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">{renter.full_name}</h3>
                  {renter.room_number && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span>Room No: {renter.room_number}</span>
                    </p>
                  )}
                  
                  {/* Financial Details — clean mini cards (matches Active Renters layout) */}
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Monthly Rent */}
                      <div className="flex flex-col items-center gap-0.5 bg-muted/40 rounded-lg px-2 py-1.5 min-w-0">
                        <div className="flex items-center gap-1">
                          <Home className="h-3 w-3 text-primary/80 flex-shrink-0" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Rent</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate w-full text-center">
                          {renter.current_rent && renter.current_rent > 0 ? `₹${renter.current_rent.toLocaleString()}` : '—'}
                        </span>
                      </div>
                      
                      {/* Security Deposit */}
                      <div className="flex flex-col items-center gap-0.5 bg-muted/40 rounded-lg px-2 py-1.5 min-w-0">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-emerald-600/80 flex-shrink-0" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Deposit</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate w-full text-center">
                          {renter.security_deposit && renter.security_deposit > 0 ? `₹${renter.security_deposit.toLocaleString()}` : '—'}
                        </span>
                      </div>
                      
                      {/* Maintenance */}
                      <div className="flex flex-col items-center gap-0.5 bg-muted/40 rounded-lg px-2 py-1.5 min-w-0">
                        <div className="flex items-center gap-1">
                          <Wrench className="h-3 w-3 text-amber-600/80 flex-shrink-0" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Maint.</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate w-full text-center">
                          {renter.maintenance_amount && renter.maintenance_amount > 0 ? `₹${renter.maintenance_amount.toLocaleString()}` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Button
                    onClick={() => handleSetRent(renter)}
                    className="min-w-[100px] bg-primary hover:bg-primary/90"
                  >
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Set Rent
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Set Rent Modal */}
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