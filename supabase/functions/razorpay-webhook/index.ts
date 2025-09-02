import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

// Note: No longer needed since payments go directly to owner's UPI ID
// Previously this function was used for automatic payouts via Razorpay Route

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

      // Payment goes directly to owner's UPI ID, no need for separate payout
      console.log('Payment completed successfully. Money transferred directly to owner via UPI.');

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