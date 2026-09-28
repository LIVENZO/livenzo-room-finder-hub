import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { BadgePercent, Check, Copy, Loader2, Sparkles, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';

const DEVICE_STORAGE_KEY = 'livenzo_installation_id';

type OfferResult = {
  status: 'available' | 'already_redeemed' | 'redeemed';
  couponCode?: string;
  billAmount?: number;
  discountAmount?: number;
};

const getDeviceId = async () => {
  if (Capacitor.isNativePlatform()) {
    const device = await Device.getId();
    return `${Capacitor.getPlatform()}:${device.identifier}`;
  }

  const storedId = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (storedId) return storedId;

  const generatedId = `web:${crypto.randomUUID()}`;
  localStorage.setItem(DEVICE_STORAGE_KEY, generatedId);
  return generatedId;
};

const RestaurantOffer = () => {
  const [open, setOpen] = useState(false);
  const [billAmount, setBillAmount] = useState('');
  const [checking, setChecking] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<OfferResult | null>(null);

  useEffect(() => {
    if (!open || result) return;

    const checkStatus = async () => {
      setChecking(true);
      try {
        const deviceId = await getDeviceId();
        const { data, error } = await supabase.functions.invoke<OfferResult>('redeem-restaurant-offer', {
          body: { action: 'status', deviceId },
        });
        if (error) throw error;
        if (data) setResult(data);
      } catch {
        toast.error('Unable to check the offer right now.');
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [open, result]);

  const redeem = async () => {
    const amount = Number(billAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      toast.error('Enter a valid bill amount.');
      return;
    }

    setRedeeming(true);
    try {
      const deviceId = await getDeviceId();
      const { data, error } = await supabase.functions.invoke<OfferResult>('redeem-restaurant-offer', {
        body: { action: 'redeem', deviceId, billAmount: amount },
      });
      if (error) throw error;
      if (data) setResult(data);
    } catch {
      toast.error('Unable to redeem the offer right now.');
    } finally {
      setRedeeming(false);
    }
  };

  const copyCoupon = async () => {
    if (!result?.couponCode) return;
    await navigator.clipboard.writeText(result.couponCode);
    toast.success('Coupon code copied');
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-secondary/60 bg-gradient-to-br from-secondary via-secondary/90 to-primary p-5 shadow-medium"
      >
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground">
            <Utensils className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-primary-foreground/80">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Renter exclusive
            </div>
            <h2 className="text-lg font-bold leading-tight text-primary-foreground">
              Get 10% OFF on Your Restaurant Bill!
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 font-semibold shadow-sm"
            onClick={() => setOpen(true)}
          >
            Redeem
          </Button>
        </div>
      </motion.section>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[90vh] max-w-2xl overflow-y-auto rounded-t-2xl pb-6"
        >
          <SheetHeader className="text-left">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BadgePercent className="h-6 w-6" aria-hidden="true" />
            </div>
            <SheetTitle className="text-2xl">Restaurant offer</SheetTitle>
            <SheetDescription>Enter your total restaurant bill to claim your one-time 10% coupon.</SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {checking ? (
              <div className="flex min-h-48 items-center justify-center" role="status" aria-label="Checking offer status">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : result?.status === 'already_redeemed' ? (
              <div className="rounded-xl border border-border bg-muted/50 p-6 text-center">
                <Check className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
                <p className="font-semibold text-foreground">Offer already redeemed on this device.</p>
              </div>
            ) : result?.status === 'redeemed' ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground">Your coupon code</p>
                  <p className="mt-1 break-all font-mono text-2xl font-bold text-primary">{result.couponCode}</p>
                  <Button type="button" variant="outline" className="mt-4" onClick={copyCoupon}>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copy code
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground">Total bill</p>
                    <p className="mt-1 text-lg font-bold text-foreground">₹{result.billAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs text-muted-foreground">You save 10%</p>
                    <p className="mt-1 text-lg font-bold text-primary">₹{result.discountAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="restaurant-bill-amount">Total bill amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">₹</span>
                    <Input
                      id="restaurant-bill-amount"
                      type="number"
                      inputMode="decimal"
                      min="1"
                      max="1000000"
                      step="0.01"
                      value={billAmount}
                      onChange={(event) => setBillAmount(event.target.value)}
                      placeholder="0.00"
                      className="h-14 pl-9 text-lg"
                    />
                  </div>
                  {Number(billAmount) > 0 && (
                    <p className="text-sm font-medium text-primary">
                      Your 10% discount: ₹{(Math.round(Number(billAmount) * 10) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <Button type="button" size="lg" className="h-12 w-full font-semibold" disabled={redeeming} onClick={redeem}>
                  {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgePercent className="h-4 w-4" />}
                  Redeem Offer
                </Button>
                <p className="text-center text-xs text-muted-foreground">One redemption per device.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default RestaurantOffer;