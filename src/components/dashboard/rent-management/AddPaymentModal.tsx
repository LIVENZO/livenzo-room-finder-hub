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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Insert payment into Supabase
      const { error } = await supabase
        .from('payments')
        .insert({
          renter_id: renterId,
          owner_id: ownerId,
          amount: Number(amount),
          status: 'paid',
          payment_status: 'paid',
          payment_date: selectedDate.toISOString(),
          property_id: '00000000-0000-0000-0000-000000000000' // Placeholder - update if needed
        });

      if (error) throw error;

      toast({
        title: "✅ Payment saved",
        description: `Payment of ₹${amount} saved successfully`
      });
      
      // Reset form and close
      setAmount('');
      setSelectedDate(new Date());
      onPaymentSaved();
      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: "❌ Failed to save payment",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setSelectedDate(new Date());
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl border-0 bg-background p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Add Payment
            </SheetTitle>
            <SheetDescription className="text-left">
              Record a rent payment for <strong>{renterName}</strong>
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
            {/* Amount Input */}
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-base font-medium text-foreground">
                Amount (₹) *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
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
                Payment Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-14 justify-start text-left font-normal border-2 rounded-xl text-base",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
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
              {saving ? 'Saving Payment...' : 'Save Payment'}
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