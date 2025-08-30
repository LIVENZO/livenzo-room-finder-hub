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

    // Use Web Crypto API for HMAC SHA-256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(razorpayKeySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureData = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signatureData)
    );

    const expectedSignature = Array.from(new Uint8Array(expectedSignatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature !== razorpaySignature) {
      console.error('Payment signature verification failed:', {
        expectedSignature,
        receivedSignature: razorpaySignature,
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        userId: user.id
      });
      throw new Error('Invalid payment signature');
    }

    // Update payment record
    const { data: payment, error: updateError } = await supabaseClient
      .from('payments')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        status: 'paid',
        payment_status: 'paid',
        payment_method: 'razorpay',
        transaction_id: razorpayPaymentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .eq('renter_id', user.id)
      .select()
      .single();

    if (updateError || !payment) {
      console.error('Payment update error:', {
        error: updateError,
        paymentId,
        userId: user.id,
        razorpayPaymentId,
        attemptedUpdate: {
          razorpay_payment_id: razorpayPaymentId,
          status: 'paid',
          payment_status: 'completed'
        }
      });
      throw new Error('Failed to update payment record');
    }

    // Update rent status to paid and set next due date if this was a rent payment
    if (payment.rent_id) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1); // Set to first day of next month
      
      const { error: rentStatusError } = await supabaseClient
        .from('rent_status')
        .update({
          status: 'paid',
          last_payment_id: payment.id,
          due_date: nextMonth.toISOString().split('T')[0], // Format as YYYY-MM-DD
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.rent_id);

      if (rentStatusError) {
        console.error('Rent status update error:', rentStatusError);
      }
    }

    console.log('Payment verified and processed successfully:', {
      paymentId: payment.id,
      razorpayPaymentId,
      relationshipId: payment.relationship_id,
      rentId: payment.rent_id
    });

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
    console.error('Payment verification failed with details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // Enhanced error messages for different failure types
    let errorMessage = 'Payment verification failed';
    let statusCode = 500;
    
    if (error.message.includes('Invalid payment signature')) {
      errorMessage = 'Payment verification failed: Invalid signature';
      statusCode = 400;
    } else if (error.message.includes('Unauthorized')) {
      errorMessage = 'Authentication required';
      statusCode = 401;
    } else if (error.message.includes('Razorpay secret not configured')) {
      errorMessage = 'Payment service configuration error';
      statusCode = 503;
    } else if (error.message.includes('Failed to update payment record')) {
      errorMessage = 'Database error: Unable to update payment status';
      statusCode = 502;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
};

serve(handler);