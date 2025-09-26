import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';

interface Renter {
  id: string;
  full_name: string;
  avatar_url?: string;
  room_number?: string;
}

interface SetRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRentSet: () => void;
  preSelectedRenter?: { id: string; name: string } | null;
}

const SetRentModal: React.FC<SetRentModalProps> = ({
  isOpen,
  onClose,
  onRentSet,
  preSelectedRenter
}) => {
  const { user } = useAuth();
  const [selectedRenterId, setSelectedRenterId] = useState<string>('');
  const [rentAmount, setRentAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date>();
  const [renters, setRenters] = useState<Renter[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRenters, setFetchingRenters] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchActiveRenters();
      // Set default due date to next month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDueDate(nextMonth);
      
      // Pre-select renter if provided
      if (preSelectedRenter) {
        setSelectedRenterId(preSelectedRenter.id);
      }
    }
  }, [isOpen, preSelectedRenter]);

  const fetchActiveRenters = async () => {
    if (!user?.id) return;
    
    try {
      setFetchingRenters(true);
      
      // Get all active relationships for this owner
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

      const renterData: Renter[] = relationships
        ?.map(rel => {
          const profile = Array.isArray(rel.user_profiles) 
            ? rel.user_profiles[0] 
            : rel.user_profiles;
          return {
            id: rel.renter_id,
            full_name: profile?.full_name || 'Unknown Renter',
            avatar_url: profile?.avatar_url || '',
            room_number: profile?.room_number || ''
          };
        })
        .filter(renter => renter.full_name !== 'Unknown Renter') || [];

      setRenters(renterData);
    } catch (error) {
      console.error('Error fetching active renters:', error);
      toast.error('Failed to load renters');
    } finally {
      setFetchingRenters(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRenterId) {
      toast.error('Please select a renter');
      return;
    }
    
    if (!rentAmount || isNaN(Number(rentAmount))) {
      toast.error('Please enter a valid rent amount');
      return;
    }
    
    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }

    setLoading(true);
    
    try {
      // Call the database function to set monthly rent
      const { data, error } = await supabase.rpc('set_renter_monthly_rent', {
        p_renter_id: selectedRenterId,
        p_monthly_rent: Number(rentAmount),
        p_next_due_date: format(dueDate, 'yyyy-MM-dd')
      });

      if (error) {
        console.error('Error setting rent:', error);
        toast.error(error.message || 'Failed to set monthly rent');
        return;
      }

      const selectedRenter = renters.find(r => r.id === selectedRenterId);
      toast.success(
        `Monthly rent for ${selectedRenter?.full_name} set to ₹${Number(rentAmount).toLocaleString()} successfully.`
      );
      
      onRentSet();
      handleClose();
    } catch (error) {
      console.error('Error setting rent:', error);
      toast.error('Failed to set monthly rent');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRenterId('');
    setRentAmount('');
    setDueDate(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Set Monthly Rent
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="renter">Select Renter</Label>
            <Select 
              value={selectedRenterId} 
              onValueChange={setSelectedRenterId}
              disabled={fetchingRenters || !!preSelectedRenter}
            >
              <SelectTrigger>
                <SelectValue 
                  placeholder={fetchingRenters ? "Loading renters..." : "Choose a renter"} 
                />
              </SelectTrigger>
              <SelectContent>
                {renters.map((renter) => (
                  <SelectItem key={renter.id} value={renter.id}>
                    <div className="flex items-center gap-2">
                      {renter.avatar_url && (
                        <img 
                          src={renter.avatar_url} 
                          alt={renter.full_name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      )}
                      <span>{renter.full_name}</span>
                      {renter.room_number && (
                        <span className="text-xs text-muted-foreground">
                          (Room {renter.room_number})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monthly Rent Amount (₹)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                min="0"
                step="100"
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₹
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Next Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading || !selectedRenterId || !rentAmount || !dueDate}
            >
              {loading ? 'Setting...' : 'Save Rent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SetRentModal;