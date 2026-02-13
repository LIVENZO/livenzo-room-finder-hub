import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(secret);
  const msgBytes = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgBytes);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      type,
      bookingRequestId,
      roomId,
      paymentId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return json(400, { success: false, error: "Missing Razorpay verification fields" });
    }

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      return json(503, { success: false, error: "Payment service unavailable" });
    }

    // 1) Verify Razorpay signature (this IS the authentication - tamper-proof)
    const expected = await hmacSha256Hex(
      razorpayKeySecret,
      `${razorpayOrderId}|${razorpayPaymentId}`
    );

    if (expected !== razorpaySignature) {
      return json(400, { success: false, error: "Invalid payment signature" });
    }

    // 2) Verify payment status with Razorpay API
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const paymentRes = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpayPaymentId}`,
      { headers: { Authorization: `Basic ${basicAuth}` } }
    );

    if (!paymentRes.ok) {
      console.error("Razorpay payment fetch failed:", paymentRes.status);
      return json(502, { success: false, error: "Failed to verify payment with gateway" });
    }

    const payment = await paymentRes.json();

    if (payment.order_id !== razorpayOrderId) {
      return json(400, { success: false, error: "Payment does not match order" });
    }

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return json(400, { success: false, error: `Payment not successful (status: ${payment.status})` });
    }

    // 3) Use service role to update DB
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- TOKEN PAYMENT (room booking) ---
    if (type === "token" && bookingRequestId && roomId) {
      // Verify booking exists and isn't already paid
      const { data: booking, error: bookingErr } = await supabaseAdmin
        .from("booking_requests")
        .select("id, token_paid")
        .eq("id", bookingRequestId)
        .maybeSingle();

      if (bookingErr || !booking) {
        return json(404, { success: false, error: "Booking not found" });
      }

      if (booking.token_paid) {
        return json(200, { success: true, message: "Already verified" });
      }

      // Lock room
      const { data: lockedRoom, error: lockErr } = await supabaseAdmin
        .from("rooms")
        .update({ booking: true, available: false, updated_at: new Date().toISOString() })
        .eq("id", roomId)
        .eq("available", true)
        .select("id")
        .maybeSingle();

      if (lockErr) {
        console.error("Room lock failed:", lockErr);
        return json(500, { success: false, error: "Failed to lock room" });
      }

      if (!lockedRoom) {
        return json(409, { success: false, error: "Room no longer available" });
      }

      // Update booking
      const { error: updateErr } = await supabaseAdmin
        .from("booking_requests")
        .update({ token_paid: true, booking_stage: "confirmed", status: "approved" })
        .eq("id", bookingRequestId);

      if (updateErr) {
        // Rollback room lock
        await supabaseAdmin
          .from("rooms")
          .update({ booking: false, available: true, updated_at: new Date().toISOString() })
          .eq("id", roomId);
        return json(500, { success: false, error: "Failed to finalize booking" });
      }

      return json(200, { success: true });
    }

    // --- RENT PAYMENT ---
    if (type === "rent" && paymentId) {
      const { error: updateErr } = await supabaseAdmin
        .from("payments")
        .update({
          payment_status: "captured",
          status: "completed",
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (updateErr) {
        console.error("Payment update failed:", updateErr);
        return json(500, { success: false, error: "Failed to update payment record" });
      }

      return json(200, { success: true });
    }

    return json(400, { success: false, error: "Invalid payment type or missing parameters" });
  } catch (error) {
    console.error("Error in razorpay-redirect-verify:", error);
    return json(500, { success: false, error: "Verification failed" });
  }
});
