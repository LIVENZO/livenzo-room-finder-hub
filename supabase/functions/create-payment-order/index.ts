import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentOrderRequest {
  amount: number;
  relationshipId: string;
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

    const { amount, relationshipId }: PaymentOrderRequest = await req.json();

    console.log('Creating payment order for:', { amount, relationshipId, userId: user.id });

    // Verify the relationship belongs to the user and is active
    const { data: relationship, error: relationshipError } = await supabaseClient
      .from('relationships')
      .select('*')
      .eq('id', relationshipId)
      .eq('renter_id', user.id)
      .eq('status', 'accepted')
      .eq('archived', false)
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
      console.error('Razorpay order creation failed:', errorText);
      throw new Error('Failed to create payment order');
    }

    const orderData = await orderResponse.json();

    // Store payment record in database
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        renter_id: user.id,
        owner_id: relationship.owner_id,
        relationship_id: relationshipId,
        amount: amount,
        razorpay_order_id: orderData.id,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Database insert error:', paymentError);
      throw new Error('Failed to store payment record');
    }

    console.log('Payment order created successfully:', orderData.id);

    return new Response(JSON.stringify({
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId: razorpayKeyId,
      paymentId: payment.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-payment-order:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);