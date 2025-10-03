import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Renter {
  id: string;
  full_name: string;
  avatar_url?: string;
  room_number?: string;
  current_rent?: number;
}

interface SetRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  renter: Renter | null;
  onSuccess: (renterId: string, newRent: number) => void;
}

const SetRentModal: React.FC<SetRentModalProps> = ({
  isOpen,
  onClose,
  renter,
  onSuccess
}) => {
  const [rentAmount, setRentAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!renter) return;
    
    if (!rentAmount || isNaN(Number(rentAmount))) {
      toast.error('Please enter a valid rent amount');
      return;
    }

    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }

    setSaving(true);
    
    try {
      // Call the database function to set monthly rent
      const { data, error } = await supabase.rpc('set_renter_monthly_rent', {
        p_renter_id: renter.id,
        p_monthly_rent: Number(rentAmount),
        p_next_due_date: format(dueDate, 'yyyy-MM-dd')
      });

      if (error) {
        console.error('Error setting rent:', error);
        toast.error(error.message || 'Failed to set monthly rent');
        return;
      }

      toast.success(
        `✅ Rent set successfully! Monthly rent for ${renter.full_name} set to ₹${Number(rentAmount).toLocaleString()}.`
      );
      
      // Update parent component
      onSuccess(renter.id, Number(rentAmount));
      
      // Reset form and close modal
      setRentAmount('');
      setDueDate(undefined);
      onClose();
      
    } catch (error) {
      console.error('Error setting rent:', error);
      toast.error('Failed to set monthly rent');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setRentAmount('');
    setDueDate(undefined);
    onClose();
  };

  // Initialize form with current values when modal opens
  React.useEffect(() => {
    if (isOpen && renter) {
      setRentAmount(renter.current_rent?.toString() || '');
      // Set default due date to today's date
      if (!dueDate) {
        setDueDate(new Date());
      }
    }
  }, [isOpen, renter]);

  if (!renter) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Set Monthly Rent
          </DialogTitle>
          <p className="text-muted-foreground">
            for {renter.full_name}
            {renter.room_number && ` • Room ${renter.room_number}`}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rent Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="rentAmount" className="text-sm font-medium text-foreground">
              Monthly Rent Amount
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="rentAmount"
                type="number"
                placeholder="Enter amount"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                min="0"
                step="100"
                className="pl-12 h-12 text-lg"
                autoFocus
              />
            </div>
          </div>

          {/* Due Date Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Monthly Due Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-3 h-5 w-5" />
                  {dueDate ? format(dueDate, "PPP") : "Select due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
            className="flex-1 h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !rentAmount || isNaN(Number(rentAmount)) || !dueDate}
            className="flex-1 h-12 bg-primary hover:bg-primary/90"
          >
            {saving ? 'Saving...' : 'Save Rent'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetRentModal;