import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, DollarSign, Save, Users, IndianRupee, Edit3, X, Check } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Renter {
  id: string;
  full_name: string;
  avatar_url?: string;
  room_number?: string;
  current_rent?: number;
}

interface SetRentListPageProps {
  onBack: () => void;
}

const SetRentListPage: React.FC<SetRentListPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [renters, setRenters] = useState<Renter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingRent, setSavingRent] = useState<Record<string, boolean>>({});
  const [rentAmounts, setRentAmounts] = useState<Record<string, string>>({});
  const [editingRenter, setEditingRenter] = useState<string | null>(null);
  const [tempRentAmount, setTempRentAmount] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      fetchActiveRenters();
    }
  }, [user]);

  const fetchActiveRenters = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all active relationships for this owner
      const { data: relationships, error: relationshipsError } = await supabase
        .from('relationships')
        .select('renter_id')
        .eq('owner_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false);

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
        .select('renter_id, monthly_rent')
        .eq('owner_id', user.id)
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
            current_rent: rentAgreement?.monthly_rent || 0
          };
        }) || [];

      setRenters(renterData);
      setError(null);
      
      // Initialize rent amounts with current values
      const initialAmounts: Record<string, string> = {};
      renterData.forEach(renter => {
        initialAmounts[renter.id] = renter.current_rent?.toString() || '';
      });
      setRentAmounts(initialAmounts);

    } catch (error) {
      console.error('Error fetching active renters:', error);
      setError('Unable to load renters. Please check your connection or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRent = (renter: Renter) => {
    setEditingRenter(renter.id);
    setTempRentAmount(renter.current_rent?.toString() || '');
  };

  const handleCancelEdit = () => {
    setEditingRenter(null);
    setTempRentAmount('');
  };

  const handleSaveRent = async (renter: Renter) => {
    if (!tempRentAmount || isNaN(Number(tempRentAmount))) {
      toast.error('Please enter a valid rent amount');
      return;
    }

    setSavingRent(prev => ({ ...prev, [renter.id]: true }));
    
    try {
      // Call the database function to set monthly rent
      const { data, error } = await supabase.rpc('set_renter_monthly_rent', {
        p_renter_id: renter.id,
        p_monthly_rent: Number(tempRentAmount),
        p_next_due_date: null // Use default next month
      });

      if (error) {
        console.error('Error setting rent:', error);
        toast.error(error.message || 'Failed to set monthly rent');
        return;
      }

      toast.success(
        `Monthly rent for ${renter.full_name} set to ₹${Number(tempRentAmount).toLocaleString()} successfully.`
      );
      
      // Update the renter's current rent in state
      setRenters(prev => prev.map(r => 
        r.id === renter.id 
          ? { ...r, current_rent: Number(tempRentAmount) }
          : r
      ));
      
      // Reset editing state
      setEditingRenter(null);
      setTempRentAmount('');
      
    } catch (error) {
      console.error('Error setting rent:', error);
      toast.error('Failed to set monthly rent');
    } finally {
      setSavingRent(prev => ({ ...prev, [renter.id]: false }));
    }
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
                  {renter.current_rent && renter.current_rent > 0 ? (
                    <div className="flex items-center gap-1 mt-1">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-600 font-medium">
                        Current Rent: ₹{renter.current_rent.toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">No rent set</p>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {editingRenter === renter.id ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={tempRentAmount}
                          onChange={(e) => setTempRentAmount(e.target.value)}
                          min="0"
                          step="100"
                          className="w-32 pl-8"
                          autoFocus
                        />
                        <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSaveRent(renter)}
                        disabled={savingRent[renter.id] || !tempRentAmount || isNaN(Number(tempRentAmount))}
                        className="min-w-[60px]"
                      >
                        {savingRent[renter.id] ? (
                          'Saving...'
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={savingRent[renter.id]}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleEditRent(renter)}
                      disabled={savingRent[renter.id]}
                      className="min-w-[100px]"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Set Rent
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SetRentListPage;