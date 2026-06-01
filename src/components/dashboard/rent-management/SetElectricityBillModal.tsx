import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SetElectricityBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  renterId: string;
  ownerId: string;
  relationshipId: string;
  renterName: string;
  currentAmount?: number | null;
  onSaved?: () => void;
}

const SetElectricityBillModal: React.FC<SetElectricityBillModalProps> = ({
  isOpen,
  onClose,
  renterId,
  ownerId,
  relationshipId,
  renterName,
  currentAmount,
  onSaved,
}) => {
  const [amount, setAmount] = useState<string>(currentAmount ? String(currentAmount) : '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) setAmount(currentAmount ? String(currentAmount) : '');
  }, [isOpen, currentAmount]);

  const handleSave = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value < 0) {
      toast.error('Please enter a valid electricity bill amount');
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const cutoff = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      // If an active (within 25 days) bill exists, update it; otherwise insert new cycle.
      const { data: existing } = await supabase
        .from('electricity_bills')
        .select('id')
        .eq('relationship_id', relationshipId)
        .gte('cycle_start_date', cutoff)
        .order('cycle_start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from('electricity_bills')
          .update({ amount: value })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('electricity_bills').insert({
          relationship_id: relationshipId,
          renter_id: renterId,
          owner_id: ownerId,
          amount: value,
          cycle_start_date: today,
        });
        if (error) throw error;
      }

      toast.success(`Electricity bill saved for ${renterName}`);
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Electricity bill save error:', err);
      toast.error('Failed to save electricity bill', { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Electricity Bill
          </DialogTitle>
          <DialogDescription>
            Set this month's electricity bill for {renterName}. Bills automatically reset every 25 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="electric-amount">Amount (₹)</Label>
            <Input
              id="electric-amount"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 1200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !amount}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Bill'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetElectricityBillModal;
