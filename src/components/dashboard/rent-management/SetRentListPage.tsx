import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, IndianRupee, Shield, Wrench, Home, Search, X } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRenters = useMemo(() => {
    if (!searchQuery.trim()) return renters;
    const q = searchQuery.toLowerCase().trim();
    return renters.filter((r) => {
      const nameMatch = r.full_name?.toLowerCase().includes(q);
      const roomNumber = r.room_number?.toLowerCase() || '';
      const roomMatch = roomNumber.includes(q);
      // Support "Room 4" style search — strip "room" prefix and match number
      const roomSearch = q.replace(/^room\s*/, '').trim();
      const roomNumberMatch = roomSearch && roomSearch !== q ? roomNumber.includes(roomSearch) : false;
      return nameMatch || roomMatch || roomNumberMatch;
    });
  }, [renters, searchQuery]);

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
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={fetchActiveRenters}
                variant="outline"
                className="min-w-[120px]"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search by room number or renter name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-12 rounded-2xl border-border/60 bg-card text-base shadow-sm focus-visible:ring-primary/30"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
            type="button"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredRenters.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent className="space-y-6">
              <div className="mx-auto w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">No renter found</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  No match for "{searchQuery}". Try a different search.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRenters.map((renter) => (
            <Card key={renter.id} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarImage src={renter.avatar_url} alt={renter.full_name} />
                    <AvatarFallback className="text-lg font-semibold">
                      {renter.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">{renter.full_name}</h3>
                    {renter.room_number && (
                      <p className="text-sm text-muted-foreground">
                        Room No: {renter.room_number}
                      </p>
                    )}
                    
                    {/* Financial Details — clean mini cards */}
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center gap-0.5 bg-muted/40 rounded-lg px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3 text-primary/80" />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Rent</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {renter.current_rent && renter.current_rent > 0 ? `₹${renter.current_rent.toLocaleString()}` : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 bg-muted/40 rounded-lg px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-emerald-600/80" />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Deposit</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {renter.security_deposit && renter.security_deposit > 0 ? `₹${renter.security_deposit.toLocaleString()}` : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 bg-muted/40 rounded-lg px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-amber-600/80" />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Maint.</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {renter.maintenance_amount && renter.maintenance_amount > 0 ? `₹${renter.maintenance_amount.toLocaleString()}` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Set Rent Button */}
                    <div className="mt-3 flex justify-end">
                      <Button
                        onClick={() => handleSetRent(renter)}
                        className="min-w-[100px] bg-primary hover:bg-primary/90"
                      >
                        <IndianRupee className="h-4 w-4 mr-2" />
                        Set Rent
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
