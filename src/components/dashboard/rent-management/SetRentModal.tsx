import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, IndianRupee, Shield, Wrench, User, DoorOpen } from 'lucide-react';
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

interface NumericInputProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  step?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onNext?: () => void;
  isLast?: boolean;
  autoFocus?: boolean;
}

const NumericInput: React.FC<NumericInputProps> = ({
  id, label, icon, value, onChange, placeholder, step = "100",
  inputRef, onNext, isLast = false, autoFocus = false,
}) => {
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onNext) onNext();
      else (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground tracking-wide">
        {label}
      </label>
      <div
        className={cn(
          "relative flex items-center rounded-2xl border bg-background shadow-sm transition-all duration-200",
          focused
            ? "border-primary ring-2 ring-primary/20 shadow-md"
            : "border-input hover:border-muted-foreground/40"
        )}
      >
        <div className="pl-4 text-muted-foreground">{icon}</div>
        <input
          ref={inputRef}
          id={id}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint={isLast ? "done" : "next"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          min="0"
          step={step}
          autoFocus={autoFocus}
          className="flex-1 h-14 bg-transparent px-3 text-base text-foreground placeholder:text-muted-foreground outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
};

const SetRentModal: React.FC<SetRentModalProps> = ({
  isOpen,
  onClose,
  renter,
  onSuccess
}) => {
  const { user } = useAuth();
  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [maintenanceAmount, setMaintenanceAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [ownerUpiId, setOwnerUpiId] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const rentRef = useRef<HTMLInputElement>(null);
  const depositRef = useRef<HTMLInputElement>(null);
  const maintenanceRef = useRef<HTMLInputElement>(null);

  const focusDeposit = useCallback(() => depositRef.current?.focus(), []);
  const focusMaintenance = useCallback(() => maintenanceRef.current?.focus(), []);
  const blurMaintenance = useCallback(() => maintenanceRef.current?.blur(), []);

  const totalAmount =
    (Number(rentAmount) || 0) +
    (Number(securityDeposit) || 0) +
    (Number(maintenanceAmount) || 0);

  const handleSubmit = async () => {
    if (!renter) return;

    if (!rentAmount || Number(rentAmount) <= 0) {
      toast.error('Please enter a valid rent amount');
      return;
    }
    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.rpc('set_renter_monthly_rent', {
        p_renter_id: renter.id,
        p_monthly_rent: Number(rentAmount),
        p_next_due_date: format(dueDate, 'yyyy-MM-dd')
      });

      if (error) {
        toast.error(error.message || 'Failed to set payment details');
        return;
      }

      if (user?.id) {
        await supabase
          .from('rental_agreements')
          .update({
            security_deposit: Number(securityDeposit) || 0,
            maintenance_amount: Number(maintenanceAmount) || 0,
          })
          .eq('owner_id', user.id)
          .eq('renter_id', renter.id)
          .eq('status', 'active');
      }

      toast.success(`✅ Payment details saved for ${renter.full_name}!`);
      onSuccess(renter.id, Number(rentAmount));

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
    } catch {
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
      if (!dueDate) setDueDate(new Date());

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

  const isValid = rentAmount && Number(rentAmount) > 0 && dueDate;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[440px] w-[calc(100%-1.5rem)] mx-auto rounded-3xl p-0 gap-0 max-h-[92dvh] overflow-hidden flex flex-col border-0 shadow-2xl">
          {/* Header Title */}
          <div className="px-5 pt-5 pb-2 shrink-0">
            <DialogHeader className="text-center space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                Set Payment Details
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 space-y-5">
            {/* Renter Info Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground font-medium">Renter Name</p>
                  <p className="text-base font-bold text-foreground truncate">{renter.full_name}</p>
                </div>
              </div>
              {renter.room_number && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-primary/10">
                  <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                    <DoorOpen className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground font-medium">Room Number</p>
                    <p className="text-base font-bold text-foreground">{renter.room_number}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              <NumericInput
                id="rentAmount"
                label="Monthly Rent Amount"
                icon={<IndianRupee className="h-5 w-5" />}
                value={rentAmount}
                onChange={setRentAmount}
                placeholder="e.g. 5000"
                inputRef={rentRef}
                onNext={focusDeposit}
                autoFocus
              />

              <NumericInput
                id="securityDeposit"
                label="Security Deposit Amount"
                icon={<Shield className="h-5 w-5" />}
                value={securityDeposit}
                onChange={setSecurityDeposit}
                placeholder="e.g. 10000"
                step="500"
                inputRef={depositRef}
                onNext={focusMaintenance}
              />

              <NumericInput
                id="maintenanceAmount"
                label="Monthly Maintenance Amount"
                icon={<Wrench className="h-5 w-5" />}
                value={maintenanceAmount}
                onChange={setMaintenanceAmount}
                placeholder="e.g. 500"
                inputRef={maintenanceRef}
                onNext={blurMaintenance}
                isLast
              />

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground tracking-wide">
                  Monthly Due Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-14 justify-start text-left font-normal rounded-2xl shadow-sm border-input hover:border-muted-foreground/40 transition-all",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                      <span className="text-base">
                        {dueDate ? format(dueDate, "PPP") : "Select due date"}
                      </span>
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
            {totalAmount > 0 && (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl px-5 py-4 border border-primary/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Total (First Payment)</span>
                  <span className="font-extrabold text-foreground text-lg tracking-tight">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1 pb-[env(safe-area-inset-bottom)]">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={saving}
                className="flex-1 h-14 rounded-2xl text-sm font-semibold border-2 hover:bg-muted/50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || !isValid}
                className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {saving ? 'Saving...' : 'Save Details'}
              </Button>
            </div>
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
