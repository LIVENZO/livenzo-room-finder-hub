import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://mlbbwoscwiarafmqbohq.supabase.co";

interface ExternalPaymentParams {
  razorpayKeyId: string;
  razorpayOrderId: string;
  amount: number;
  currency?: string;
  description?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  // For token payments
  bookingId?: string;
  roomId?: string;
  // For rent payments
  paymentId?: string;
  type: 'token' | 'rent';
}

/**
 * Check if we should use external browser for Razorpay
 * (Android WebView doesn't support UPI app intents)
 */
export function shouldUseExternalBrowser(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Open Razorpay checkout in external browser (Chrome)
 * for Android WebView compatibility with UPI apps
 */
export async function openRazorpayInBrowser(params: ExternalPaymentParams): Promise<void> {
  // Get the app's published URL for the external payment page
  const baseUrl = getAppBaseUrl();

  const searchParams = new URLSearchParams({
    key: params.razorpayKeyId,
    order_id: params.razorpayOrderId,
    amount: params.amount.toString(),
    currency: params.currency || 'INR',
    description: params.description || 'Livenzo Payment',
    type: params.type,
    supabase_url: SUPABASE_URL,
  });

  if (params.userName) searchParams.set('name', params.userName);
  if (params.userEmail) searchParams.set('email', params.userEmail);
  if (params.userPhone) searchParams.set('phone', params.userPhone);
  if (params.bookingId) searchParams.set('booking_id', params.bookingId);
  if (params.roomId) searchParams.set('room_id', params.roomId);
  if (params.paymentId) searchParams.set('payment_id', params.paymentId);

  const paymentUrl = `${baseUrl}/external-pay.html?${searchParams.toString()}`;

  await Browser.open({ url: paymentUrl });
}

/**
 * Store pending payment info so the app can check status on return
 */
export function storePendingPayment(params: {
  type: 'token' | 'rent';
  bookingId?: string;
  roomId?: string;
  paymentId?: string;
}) {
  localStorage.setItem('pending_razorpay_payment', JSON.stringify({
    ...params,
    timestamp: Date.now(),
  }));
}

/**
 * Check and handle any pending payment when the app resumes
 */
export async function checkPendingPayment(): Promise<{
  found: boolean;
  success?: boolean;
  type?: string;
} | null> {
  const stored = localStorage.getItem('pending_razorpay_payment');
  if (!stored) return null;

  try {
    const pending = JSON.parse(stored);
    
    // Only check payments from the last 30 minutes
    if (Date.now() - pending.timestamp > 30 * 60 * 1000) {
      localStorage.removeItem('pending_razorpay_payment');
      return null;
    }

    if (pending.type === 'token' && pending.bookingId) {
      const { data } = await supabase
        .from('booking_requests')
        .select('token_paid, status, booking_stage')
        .eq('id', pending.bookingId)
        .maybeSingle();

      if (data?.token_paid) {
        localStorage.removeItem('pending_razorpay_payment');
        return { found: true, success: true, type: 'token' };
      }
      
      return { found: true, success: false, type: 'token' };
    }

    if (pending.type === 'rent' && pending.paymentId) {
      const { data } = await supabase
        .from('payments')
        .select('payment_status, status')
        .eq('id', pending.paymentId)
        .maybeSingle();

      if (data?.status === 'completed' || data?.payment_status === 'captured') {
        localStorage.removeItem('pending_razorpay_payment');
        return { found: true, success: true, type: 'rent' };
      }

      return { found: true, success: false, type: 'rent' };
    }
  } catch (e) {
    console.error('Error checking pending payment:', e);
  }

  return null;
}

/**
 * Clear pending payment data
 */
export function clearPendingPayment() {
  localStorage.removeItem('pending_razorpay_payment');
}

function getAppBaseUrl(): string {
  // Use published URL for external browser access
  // This ensures the external-pay.html page is accessible
  return 'https://livenzo-room-finder-hub.lovable.app';
}
