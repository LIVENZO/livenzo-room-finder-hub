import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, DollarSign, Save, Users } from 'lucide-react';
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
  const [savingRent, setSavingRent] = useState<Record<string, boolean>>({});
  const [rentAmounts, setRentAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.id) {
      fetchActiveRenters();
    }
  }, [user]);

  const fetchActiveRenters = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get all active relationships with renter profiles
      const { data: relationships, error: relationshipsError } = await supabase
        .from('relationships')
        .select(`
          renter_id,
          user_profiles!relationships_renter_id_fkey(
            id,
            full_name,
            avatar_url,
            room_number
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'accepted')
        .eq('archived', false);

      if (relationshipsError) {
        console.error('Error fetching relationships:', relationshipsError);
        toast.error('Failed to load renters');
        return;
      }

      if (!relationships || relationships.length === 0) {
        setRenters([]);
        return;
      }

      // Get current rent amounts from rental agreements
      const renterIds = relationships.map(r => r.renter_id);
      const { data: rentAgreements, error: rentError } = await supabase
        .from('rental_agreements')
        .select('renter_id, monthly_rent')
        .eq('owner_id', user.id)
        .in('renter_id', renterIds)
        .eq('status', 'active');

      if (rentError) {
        console.error('Error fetching rent agreements:', rentError);
      }

      const renterData: Renter[] = relationships
        .map(rel => {
          const profile = Array.isArray(rel.user_profiles) 
            ? rel.user_profiles[0] 
            : rel.user_profiles;
          
          if (!profile?.full_name || profile.full_name === 'Unknown Renter') {
            return null;
          }

          const rentAgreement = rentAgreements?.find(ra => ra.renter_id === rel.renter_id);
          
          return {
            id: rel.renter_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url || '',
            room_number: profile.room_number || '',
            current_rent: rentAgreement?.monthly_rent || 0
          };
        })
        .filter(Boolean) as Renter[];

      setRenters(renterData);
      
      // Initialize rent amounts with current values
      const initialAmounts: Record<string, string> = {};
      renterData.forEach(renter => {
        initialAmounts[renter.id] = renter.current_rent?.toString() || '';
      });
      setRentAmounts(initialAmounts);

    } catch (error) {
      console.error('Error fetching active renters:', error);
      toast.error('Failed to load renters');
    } finally {
      setLoading(false);
    }
  };

  const handleRentAmountChange = (renterId: string, value: string) => {
    setRentAmounts(prev => ({
      ...prev,
      [renterId]: value
    }));
  };

  const handleSaveRent = async (renter: Renter) => {
    const rentAmount = rentAmounts[renter.id];
    
    if (!rentAmount || isNaN(Number(rentAmount))) {
      toast.error('Please enter a valid rent amount');
      return;
    }

    setSavingRent(prev => ({ ...prev, [renter.id]: true }));
    
    try {
      // Call the database function to set monthly rent
      const { data, error } = await supabase.rpc('set_renter_monthly_rent', {
        p_renter_id: renter.id,
        p_monthly_rent: Number(rentAmount),
        p_next_due_date: null // Use default next month
      });

      if (error) {
        console.error('Error setting rent:', error);
        toast.error(error.message || 'Failed to set monthly rent');
        return;
      }

      toast.success(
        `Monthly rent for ${renter.full_name} set to ₹${Number(rentAmount).toLocaleString()} successfully.`
      );
      
      // Update the renter's current rent in state
      setRenters(prev => prev.map(r => 
        r.id === renter.id 
          ? { ...r, current_rent: Number(rentAmount) }
          : r
      ));
      
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

  if (renters.length === 0) {
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
        
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Renters Connected</h3>
            <p className="text-muted-foreground">
              No renters connected yet. Please connect renters to manage rent.
            </p>
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
                <Avatar className="h-12 w-12">
                  <AvatarImage src={renter.avatar_url} alt={renter.full_name} />
                  <AvatarFallback>
                    {renter.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{renter.full_name}</h3>
                  {renter.room_number && (
                    <p className="text-sm text-muted-foreground">Room {renter.room_number}</p>
                  )}
                  {renter.current_rent && renter.current_rent > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      Current: ₹{renter.current_rent.toLocaleString()}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={rentAmounts[renter.id] || ''}
                      onChange={(e) => handleRentAmountChange(renter.id, e.target.value)}
                      min="0"
                      step="100"
                      className="w-32 pl-8"
                    />
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <Button
                    onClick={() => handleSaveRent(renter)}
                    disabled={
                      savingRent[renter.id] || 
                      !rentAmounts[renter.id] || 
                      isNaN(Number(rentAmounts[renter.id]))
                    }
                    className={cn(
                      "min-w-[80px]",
                      savingRent[renter.id] && "animate-pulse"
                    )}
                  >
                    {savingRent[renter.id] ? (
                      'Saving...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
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