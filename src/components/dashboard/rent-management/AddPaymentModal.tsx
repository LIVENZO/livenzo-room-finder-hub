import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  renterName: string;
  renterId: string;
  ownerId: string;
  onPaymentSaved: () => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  renterName,
  renterId,
  ownerId,
  onPaymentSaved
}) => {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid monthly rent amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // First, verify that there's an accepted relationship between owner and renter
      const { data: relationship, error: relationshipError } = await supabase
        .from('relationships')
        .select('id, status, renter_id')
        .eq('owner_id', ownerId)
        .eq('renter_id', renterId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (relationshipError) {
        console.error('Error checking relationship:', relationshipError);
        throw new Error('Failed to verify connection with renter');
      }

      if (!relationship) {
        toast({
          title: "❌ Cannot set rent",
          description: "You must be connected to this renter to set their monthly rent.",
          variant: "destructive"
        });
        return;
      }

      // Get or create a property_id - for simplicity using a default/first property
      // In real app, you'd select which property this rental is for
      const property_id = crypto.randomUUID(); // Generate a property ID for this rental agreement

      // Create/update rental agreement (the main fix)
      const { error: agreementError } = await supabase
        .from('rental_agreements')
        .upsert({
          property_id: property_id,
          owner_id: ownerId,
          renter_id: renterId,
          monthly_rent: Number(amount),
          start_date: new Date().toISOString(),
          status: 'active'
        }, {
          onConflict: 'property_id,renter_id'
        });

      if (agreementError) {
        console.error('Error creating rental agreement:', agreementError);
        throw agreementError;
      }

      // Update or insert rent_status for this relationship
      const { error: rentStatusError } = await supabase
        .from('rent_status')
        .upsert({
          relationship_id: relationship.id,
          current_amount: Number(amount),
          due_date: dueDate.toISOString().split('T')[0], // Format as date only
          status: 'pending',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'relationship_id'
        });

      if (rentStatusError) {
        console.error('Supabase rent_status error:', rentStatusError);
        throw rentStatusError;
      }

      // Also update the rent status in the payments table for consistency
      const { error: paymentsError } = await supabase
        .from('payments')
        .update({ 
          rent_id: relationship.id,
          due_date: dueDate.toISOString()
        })
        .eq('renter_id', renterId)
        .eq('owner_id', ownerId)
        .is('rent_id', null);

      if (paymentsError) {
        console.error('Supabase payments error:', paymentsError);
        // Don't throw here - payments update is optional
      }

      toast({
        title: "✅ Monthly rent set successfully",
        description: `Monthly rent of ₹${amount} set for ${renterName}`
      });
      
      // Reset form and close
      setAmount('');
      setDueDate(new Date());
      onPaymentSaved();
      onClose();
    } catch (error: any) {
      console.error('Error setting monthly rent:', error);
      
      const errorMessage = error?.message || 'Please check your input or try again later';
      toast({
        title: "❌ Failed to set monthly rent",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDueDate(new Date());
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl border-0 bg-background p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Set Monthly Rent
            </SheetTitle>
            <SheetDescription className="text-left">
              Set monthly rent amount for <strong>{renterName}</strong>
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
            {/* Amount Input */}
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base font-medium text-foreground">
                Monthly Rent Amount (₹) *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter monthly rent amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-12 h-14 text-base border-2 rounded-xl focus:border-primary"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-3">
              <Label className="text-base font-medium text-foreground">
                Next Due Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-14 justify-start text-left font-normal border-2 rounded-xl text-base",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t bg-muted/20 space-y-3">
            <Button
              onClick={handleSave}
              disabled={!amount || Number(amount) <= 0 || saving}
              className="w-full h-14 text-base font-medium rounded-xl"
              size="lg"
            >
              {saving ? 'Setting Rent...' : 'Set Monthly Rent'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="w-full h-12 text-base border-2 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddPaymentModal;