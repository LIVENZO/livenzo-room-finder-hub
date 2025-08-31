import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentVerificationRequest {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  paymentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Verify payment function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? ''
          }
        }
      }
    );

    // Get user from token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const user = data.user;
    console.log('Authenticated user:', user.id);

    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentId }: PaymentVerificationRequest = await req.json();

    // Validate required parameters
    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !paymentId) {
      throw new Error('Missing required parameters for payment verification');
    }

    console.log('Verifying payment:', { razorpayPaymentId, razorpayOrderId, paymentId });

    // Verify Razorpay signature
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      throw new Error('Payment service configuration error');
    }

    // Create signature verification string
    const signatureString = `${razorpayOrderId}|${razorpayPaymentId}`;
    
    // Convert secret to Uint8Array
    const keyBytes = new TextEncoder().encode(razorpayKeySecret);
    const messageBytes = new TextEncoder().encode(signatureString);
    
    // Create HMAC SHA256 hash
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature !== razorpaySignature) {
      console.error('Payment signature verification failed');
      throw new Error('Invalid payment signature');
    }

    console.log('Payment signature verified successfully');

    // Update payment record in database
    const { data: payment, error: updateError } = await supabaseClient
      .from('payments')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .eq('renter_id', user.id) // Ensure user can only update their own payments
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update payment record');
    }

    if (!payment) {
      console.error('Payment record not found or access denied');
      throw new Error('Payment record not found or access denied');
    }

    console.log('Payment verification completed successfully:', payment.id);

    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        razorpayPaymentId: razorpayPaymentId,
        razorpayOrderId: razorpayOrderId
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in verify-payment:', error);
    const safeMessage = (error as Error)?.message || 'Unknown error';

    let errorMessage = 'Payment verification failed';
    let statusCode = 500;
    
    if (safeMessage.includes('Invalid payment signature')) {
      errorMessage = 'Payment verification failed: Invalid signature';
      statusCode = 400;
    } else if (safeMessage.includes('Payment service configuration')) {
      errorMessage = 'Payment service temporarily unavailable';
      statusCode = 503;
    } else if (safeMessage.includes('Unauthorized')) {
      errorMessage = 'Authentication required';
      statusCode = 401;
    } else if (safeMessage.includes('Missing required parameters')) {
      errorMessage = safeMessage;
      statusCode = 400;
    } else if (safeMessage.includes('Payment record not found')) {
      errorMessage = 'Payment record not found or access denied';
      statusCode = 404;
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      debug: safeMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
};

serve(handler);