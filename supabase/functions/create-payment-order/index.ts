import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentOrderRequest {
  amount: number;
  relationshipId: string;
  rentId?: string;
  paymentMethod?: string;
}

const handler = async (req: Request): Promise<Response> => {
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
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { amount, relationshipId, rentId, paymentMethod = 'razorpay' }: PaymentOrderRequest = await req.json();

    console.log('Creating payment order for:', { amount, relationshipId, userId: user.id });

    // Verify the relationship belongs to the user and is active
    const { data: relationship, error: relationshipError } = await supabaseClient
      .from('relationships')
      .select('*')
      .eq('id', relationshipId)
      .eq('status', 'accepted')
      .eq('archived', false)
      .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
      .maybeSingle();

    if (relationshipError) {
      console.error('Relationship query error:', relationshipError);
      throw new Error('Database error while verifying relationship');
    }

    if (!relationship) {
      console.error('No valid relationship found for user:', user.id, 'relationshipId:', relationshipId);
      
      // Debug: Let's check what relationships exist for this user
      const { data: debugRelationships } = await supabaseClient
        .from('relationships')
        .select('*')
        .eq('renter_id', user.id);
      
      console.error('Available relationships for user:', debugRelationships);
      throw new Error('Invalid relationship or access denied');
    }

    console.log('Valid relationship found:', relationship.id);

    // Create Razorpay order
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `rent_${relationshipId}_${Date.now()}`,
        notes: {
          relationship_id: relationshipId,
          renter_id: user.id,
          owner_id: relationship.owner_id,
        }
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Razorpay order creation failed:', {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        error: errorText,
        keyId: razorpayKeyId ? 'Present' : 'Missing',
        keySecret: razorpayKeySecret ? 'Present' : 'Missing',
        amount: amount,
        relationshipId: relationshipId
      });
      
      // Parse Razorpay error for better user feedback
      let razorpayError = 'Unknown payment gateway error';
      try {
        const errorJson = JSON.parse(errorText);
        razorpayError = errorJson.error?.description || errorJson.message || razorpayError;
      } catch (parseError) {
        console.error('Failed to parse Razorpay error:', parseError);
      }
      
      throw new Error(`Failed to create payment order: ${razorpayError}`);
    }

    const orderData = await orderResponse.json();

    // Store payment record in database
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        renter_id: user.id,
        owner_id: relationship.owner_id,
        relationship_id: relationshipId,
        rent_id: rentId,
        amount: amount,
        razorpay_order_id: orderData.id,
        status: 'pending',
        payment_status: 'pending',
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Database insert error:', paymentError);
      throw new Error('Failed to store payment record');
    }

    console.log('Payment order created successfully:', orderData.id);

    return new Response(JSON.stringify({
      razorpayOrderId: orderData.id,
      razorpayKeyId: razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      paymentId: payment.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-payment-order:', error);
    // Avoid referencing variables that might be undefined
    const safeMessage = (error as Error)?.message || 'Unknown error';

    // Enhanced error messages for different failure types
    let errorMessage = 'Payment order creation failed';
    let statusCode = 500;
    
    if (safeMessage.includes('Invalid relationship')) {
      errorMessage = 'Access denied: Invalid relationship or user permissions';
      statusCode = 403;
    } else if (safeMessage.includes('Razorpay credentials')) {
      errorMessage = 'Payment service configuration error';
      statusCode = 503;
    } else if (safeMessage.includes('Failed to create payment order')) {
      errorMessage = 'Payment gateway error: Unable to create order';
      statusCode = 502;
    } else if (safeMessage.includes('Unauthorized')) {
      errorMessage = 'Authentication required';
      statusCode = 401;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      debug: (Deno.env.get('NODE_ENV') === 'development') ? safeMessage : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
};

serve(handler);