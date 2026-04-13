import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, IndianRupee, Shield, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth';
import PaymentBreakdownQRModal from './PaymentBreakdownQRModal';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [maintenanceAmount, setMaintenanceAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [ownerUpiId, setOwnerUpiId] = useState('');
  const [ownerName, setOwnerName] = useState('');

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
      const { data, error } = await supabase.rpc('set_renter_monthly_rent', {
        p_renter_id: renter.id,
        p_monthly_rent: Number(rentAmount),
        p_next_due_date: format(dueDate, 'yyyy-MM-dd')
      });

      if (error) {
        console.error('Error setting rent:', error);
        toast.error(error.message || 'Failed to set payment details');
        return;
      }

      // Save security deposit and maintenance to rental_agreements
      if (user?.id) {
        const depositVal = Number(securityDeposit) || 0;
        const maintenanceVal = Number(maintenanceAmount) || 0;

        await supabase
          .from('rental_agreements')
          .update({
            security_deposit: depositVal,
            maintenance_amount: maintenanceVal,
          })
          .eq('owner_id', user.id)
          .eq('renter_id', renter.id)
          .eq('status', 'active');
      }

      toast.success(`✅ Payment details saved for ${renter.full_name}!`);
      onSuccess(renter.id, Number(rentAmount));

      // Fetch owner UPI details for QR
      if (user?.id) {
        const [upiRes, profileRes] = await Promise.all([
          supabase
            .from('owner_upi_details')
            .select('upi_id')
            .eq('owner_id', user.id)
            .eq('is_active', true)
            .maybeSingle(),
          supabase
            .from('user_profiles')
            .select('full_name, hostel_pg_name, upi_phone_number')
            .eq('id', user.id)
            .single(),
        ]);

        const upi = upiRes.data?.upi_id || (profileRes.data?.upi_phone_number ? `${profileRes.data.upi_phone_number}@ybl` : '');
        setOwnerUpiId(upi);
        setOwnerName(profileRes.data?.hostel_pg_name || profileRes.data?.full_name || 'Owner');
      }

      onClose();
      setShowQR(true);
    } catch (error) {
      console.error('Error setting rent:', error);
      toast.error('Failed to set payment details');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setRentAmount('');
    setSecurityDeposit('');
    setMaintenanceAmount('');
    setDueDate(undefined);
    onClose();
  };

  React.useEffect(() => {
    if (isOpen && renter) {
      setRentAmount(renter.current_rent?.toString() || '');
      if (!dueDate) {
        setDueDate(new Date());
      }
      // Load existing deposit/maintenance
      if (user?.id && renter.id) {
        supabase
          .from('rental_agreements')
          .select('security_deposit, maintenance_amount')
          .eq('owner_id', user.id)
          .eq('renter_id', renter.id)
          .eq('status', 'active')
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setSecurityDeposit((data as any).security_deposit?.toString() || '');
              setMaintenanceAmount((data as any).maintenance_amount?.toString() || '');
            }
          });
      }
    }
  }, [isOpen, renter]);

  if (!renter) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Set Payment Details
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              for {renter.full_name}
              {renter.room_number && ` • Room ${renter.room_number}`}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Monthly Rent */}
            <div className="space-y-1.5">
              <Label htmlFor="rentAmount" className="text-sm font-medium text-foreground">
                Monthly Rent Amount
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="rentAmount"
                  type="number"
                  placeholder="e.g. 5000"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  min="0"
                  step="100"
                  className="pl-10 h-11 rounded-xl shadow-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Security Deposit */}
            <div className="space-y-1.5">
              <Label htmlFor="securityDeposit" className="text-sm font-medium text-foreground">
                Security Deposit Amount
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="securityDeposit"
                  type="number"
                  placeholder="e.g. 10000"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  min="0"
                  step="500"
                  className="pl-10 h-11 rounded-xl shadow-sm"
                />
              </div>
            </div>

            {/* Maintenance */}
            <div className="space-y-1.5">
              <Label htmlFor="maintenanceAmount" className="text-sm font-medium text-foreground">
                Monthly Maintenance Amount
              </Label>
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="maintenanceAmount"
                  type="number"
                  placeholder="e.g. 500"
                  value={maintenanceAmount}
                  onChange={(e) => setMaintenanceAmount(e.target.value)}
                  min="0"
                  step="100"
                  className="pl-10 h-11 rounded-xl shadow-sm"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Monthly Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal rounded-xl shadow-sm",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4" />
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

          {/* Total preview */}
          {(Number(rentAmount) > 0) && (
            <div className="bg-muted/50 rounded-xl px-4 py-3 mt-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total (First Payment)</span>
                <span className="font-bold text-foreground text-base">
                  ₹{(
                    (Number(rentAmount) || 0) +
                    (Number(securityDeposit) || 0) +
                    (Number(maintenanceAmount) || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !rentAmount || isNaN(Number(rentAmount)) || !dueDate}
              className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 font-semibold"
            >
              {saving ? 'Saving...' : 'Save Details'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentBreakdownQRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        breakdown={{
          rent: Number(rentAmount) || 0,
          securityDeposit: Number(securityDeposit) || 0,
          maintenance: Number(maintenanceAmount) || 0,
        }}
        upiId={ownerUpiId}
        ownerName={ownerName}
        renterName={renter.full_name}
      />
    </>
  );
};

export default SetRentModal;
