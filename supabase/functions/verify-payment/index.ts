import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  paymentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentId }: VerifyPaymentRequest = await req.json();

    // Verify signature
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret not configured');
    }

    const crypto = await import("node:crypto");
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new Error('Invalid payment signature');
    }

    // Update payment record
    const { data: payment, error: updateError } = await supabaseClient
      .from('payments')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        status: 'paid',
        payment_status: 'completed',
        payment_method: 'upi',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .eq('renter_id', user.id)
      .select()
      .single();

    if (updateError || !payment) {
      console.error('Payment update error:', updateError);
      throw new Error('Failed to update payment record');
    }

    // Update rent status
    const { error: rentStatusError } = await supabaseClient
      .from('rent_status')
      .update({
        status: 'paid',
        last_payment_id: payment.id,
        updated_at: new Date().toISOString()
      })
      .eq('relationship_id', payment.relationship_id);

    if (rentStatusError) {
      console.error('Rent status update error:', rentStatusError);
    }

    console.log('Payment verified successfully:', razorpayPaymentId);

    return new Response(JSON.stringify({
      success: true,
      payment: payment
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in verify-payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);