import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: {
    amount: number;
    paymentDate: Date;
    renterId: string;
  }) => Promise<void>;
  renterName: string;
  renterId: string;
  loading?: boolean;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  renterName,
  renterId,
  loading = false
}) => {
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        amount: Number(amount),
        paymentDate: selectedDate,
        renterId
      });
      
      // Reset form
      setAmount('');
      setSelectedDate(new Date());
      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Add Payment
          </DialogTitle>
          <DialogDescription>
            Record a rent payment for <strong>{renterName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount (₹) *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 min-h-[48px] text-base"
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Payment Date *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full min-h-[48px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={!amount || Number(amount) <= 0 || saving || loading}
              className="flex-1 min-h-[48px]"
            >
              {saving ? 'Saving...' : 'Save Payment'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving || loading}
              className="flex-1 min-h-[48px]"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentModal;