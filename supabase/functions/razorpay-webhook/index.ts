import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

// Function to initiate payout to owner's UPI ID
async function initiateOwnerPayout(supabaseClient: any, paymentRecord: any, razorpayPayment: any) {
  console.log('Initiating automatic payout for payment:', paymentRecord.id);

  // Get owner's profile with UPI details
  const { data: ownerProfile, error: ownerError } = await supabaseClient
    .from('user_profiles')
    .select('upi_id, full_name')
    .eq('id', paymentRecord.owner_id)
    .single();

  if (ownerError || !ownerProfile) {
    console.error('Error fetching owner profile:', ownerError);
    throw new Error('Owner profile not found');
  }

  if (!ownerProfile.upi_id) {
    console.error('Owner UPI ID not found for owner:', paymentRecord.owner_id);
    throw new Error('Owner UPI ID not configured');
  }

  console.log('Owner UPI ID found:', ownerProfile.upi_id);

  const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
  const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

  // Step 1: Create Fund Account for UPI if it doesn't exist
  const fundAccountPayload = {
    account_type: 'vpa',
    vpa: {
      address: ownerProfile.upi_id
    },
    contact: {
      name: ownerProfile.full_name || 'Property Owner',
      email: `owner_${paymentRecord.owner_id}@livenzo.com`,
      contact: '9999999999', // Placeholder - you can update this
      type: 'vendor'
    }
  };

  console.log('Creating fund account for UPI:', ownerProfile.upi_id);

  const fundAccountResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fundAccountPayload),
  });

  if (!fundAccountResponse.ok) {
    const errorText = await fundAccountResponse.text();
    console.error('Fund account creation failed:', {
      status: fundAccountResponse.status,
      error: errorText
    });
    throw new Error(`Fund account creation failed: ${errorText}`);
  }

  const fundAccount = await fundAccountResponse.json();
  console.log('Fund account created successfully:', fundAccount.id);

  // Step 2: Create Payout
  const payoutAmount = Math.round(parseFloat(paymentRecord.amount) * 100); // Convert to paise
  
  const payoutPayload = {
    fund_account_id: fundAccount.id,
    amount: payoutAmount,
    currency: 'INR',
    mode: 'UPI',
    purpose: 'payout',
    notes: {
      payment_id: paymentRecord.id,
      rent_payment: 'true',
      owner_id: paymentRecord.owner_id,
      renter_id: paymentRecord.renter_id
    }
  };

  console.log('Creating payout of ₹', paymentRecord.amount, 'to UPI:', ownerProfile.upi_id);

  const payoutResponse = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payoutPayload),
  });

  if (!payoutResponse.ok) {
    const errorText = await payoutResponse.text();
    console.error('Payout creation failed:', {
      status: payoutResponse.status,
      error: errorText
    });
    throw new Error(`Payout creation failed: ${errorText}`);
  }

  const payout = await payoutResponse.json();
  console.log('Payout initiated successfully:', {
    payoutId: payout.id,
    amount: payout.amount,
    status: payout.status,
    upiId: ownerProfile.upi_id
  });

  // Log the payout in database for tracking
  const { error: logError } = await supabaseClient
    .from('payments')
    .update({
      transaction_id: `${paymentRecord.transaction_id}_payout_${payout.id}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentRecord.id);

  if (logError) {
    console.error('Error logging payout details:', logError);
  }

  return payout;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Razorpay webhook received');

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.text();
    if (!body) {
      console.error('Webhook has empty body');
      return new Response('No body', { status: 400, headers: corsHeaders });
    }
    const signature = req.headers.get("x-razorpay-signature") || req.headers.get("X-Razorpay-Signature");
    
    console.log('Webhook signature:', signature);

    // Verify webhook signature (recommended for production)
    if (signature && Deno.env.get("RAZORPAY_WEBHOOK_SECRET")) {
      const crypto = await import("https://deno.land/std@0.190.0/crypto/mod.ts");
      const encoder = new TextEncoder();
      const key = await crypto.crypto.subtle.importKey(
        "raw",
        encoder.encode(Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || ""),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const expectedSignature = await crypto.crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(body)
      );

      const hexSignature = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      if (hexSignature !== signature) {
        console.error('Invalid webhook signature');
        return new Response("Invalid signature", { status: 400, headers: corsHeaders });
      }
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', event.event, event.payload?.payment?.entity?.id);

    // Handle payment captured event
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      
      console.log('Processing captured payment:', payment.id);

      // Find the payment record by razorpay_order_id
      const { data: paymentRecord, error: findError } = await supabaseClient
        .from("payments")
        .select("*")
        .eq("razorpay_order_id", payment.order_id)
        .single();

      if (findError) {
        console.error('Error finding payment record:', findError);
        throw findError;
      }

      if (!paymentRecord) {
        console.error('Payment record not found for order:', payment.order_id);
        return new Response("Payment record not found", { status: 404 });
      }

      // Update payment status
      const { data: updatedPayment, error: updateError } = await supabaseClient
        .from("payments")
        .update({
          payment_status: "paid",
          status: "paid",
          razorpay_payment_id: payment.id,
          transaction_id: payment.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating payment:', updateError);
        throw updateError;
      }

      console.log('Payment updated successfully via webhook');

      // Update rent status if this was a rent payment
      if (updatedPayment.rent_id) {
        const { error: rentError } = await supabaseClient
          .from("rent_status")
          .update({
            status: "paid",
            last_payment_id: updatedPayment.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", updatedPayment.rent_id);

        if (rentError) {
          console.error('Error updating rent status via webhook:', rentError);
        } else {
          console.log('Rent status updated to paid via webhook');
        }
      }

      // Initiate automatic payout to owner
      try {
        await initiateOwnerPayout(supabaseClient, updatedPayment, payment);
      } catch (payoutError) {
        console.error('Payout failed but payment was successful:', payoutError);
        // Don't fail the webhook - payment was successful, payout can be retried
      }

      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Handle payment failed event
    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      
      console.log('Processing failed payment:', payment.id);

      // Find and update payment record
      const { error: updateError } = await supabaseClient
        .from("payments")
        .update({
          payment_status: "failed",
          status: "failed",
          razorpay_payment_id: payment.id,
          updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", payment.order_id);

      if (updateError) {
        console.error('Error updating failed payment:', updateError);
        throw updateError;
      }

      console.log('Failed payment updated successfully via webhook');
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    console.log('Unhandled webhook event:', event.event);
    return new Response("Event not handled", { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Webhook processing failed", { status: 500, headers: corsHeaders });
  }
});