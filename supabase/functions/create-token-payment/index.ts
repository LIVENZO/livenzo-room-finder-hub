import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "create_order" | "verify_payment";

interface CreateOrderBody {
  action: "create_order";
  bookingRequestId: string;
  roomId: string;
}

interface VerifyPaymentBody {
  action: "verify_payment";
  bookingRequestId: string;
  roomId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

type RequestBody = CreateOrderBody | VerifyPaymentBody;

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
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
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
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { success: false, error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");

    // User-scoped client to validate token
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser(token);
    if (userErr || !userData.user) {
      console.error("Auth error:", userErr);
      return json(401, { success: false, error: "Unauthorized" });
    }

    const userId = userData.user.id;

    const body = (await req.json()) as RequestBody;
    const action = (body as any)?.action as Action | undefined;

    if (!action) {
      return json(400, { success: false, error: "Missing required field: action" });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey ?? (Deno.env.get("SUPABASE_ANON_KEY") ?? ""),
    );

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) {
      return json(503, { success: false, error: "Payment service temporarily unavailable" });
    }

    const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    // 1) Validate booking request (NO relationship checks)
    const bookingRequestId = body.bookingRequestId;
    const roomId = body.roomId;

    if (!bookingRequestId || !roomId) {
      return json(400, { success: false, error: "Missing required fields: bookingRequestId, roomId" });
    }

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from("booking_requests")
      .select("id, user_id, room_id, token_paid, token_amount")
      .eq("id", bookingRequestId)
      .maybeSingle();

    if (bookingErr) {
      console.error("Booking request lookup error:", bookingErr);
      return json(500, { success: false, error: "Database error while validating booking request" });
    }

    if (!booking) {
      return json(404, { success: false, error: "Booking request not found" });
    }

    if (booking.user_id !== userId) {
      return json(403, { success: false, error: "Access denied" });
    }

    if (booking.room_id !== roomId) {
      return json(400, { success: false, error: "Invalid room for this booking request" });
    }

    if (booking.token_paid) {
      return json(409, { success: false, error: "Token already paid" });
    }

    // --- CREATE ORDER ---
    if (action === "create_order") {
      const tokenAmountRupees = Number(booking.token_amount ?? 1000);
      if (!Number.isFinite(tokenAmountRupees) || tokenAmountRupees <= 0) {
        return json(400, { success: false, error: "Invalid token amount" });
      }

      const orderPayload = {
        amount: Math.round(tokenAmountRupees * 100),
        currency: "INR",
        receipt: `token_${bookingRequestId}_${Date.now()}`,
        payment_capture: 1,
        notes: {
          booking_request_id: bookingRequestId,
          room_id: roomId,
          user_id: userId,
          payment_type: "room_booking_token",
          description: "Livenzo Room Booking Token",
        },
      };

      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const errorText = await orderRes.text();
        console.error("Razorpay order creation failed:", orderRes.status, errorText);
        return json(502, {
          success: false,
          error: "Failed to create payment order",
          debug: errorText,
        });
      }

      const order = await orderRes.json();

      // Keep booking request in token_pending (client also does this, but server-side is authoritative)
      const { error: stageErr } = await supabaseAdmin
        .from("booking_requests")
        .update({
          booking_stage: "token_pending",
          token_required: true,
          token_paid: false,
          status: "initiated",
        })
        .eq("id", bookingRequestId);

      if (stageErr) {
        console.error("Failed to update booking stage:", stageErr);
        // Non-fatal for order creation; still return order so user can pay.
      }

      return json(200, {
        success: true,
        razorpayOrderId: order.id,
        razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
      });
    }

    // --- VERIFY PAYMENT ---
    if (action === "verify_payment") {
      const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = body as VerifyPaymentBody;

      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        return json(400, { success: false, error: "Missing Razorpay verification fields" });
      }

      // Verify signature
      const expected = await hmacSha256Hex(
        razorpayKeySecret,
        `${razorpayOrderId}|${razorpayPaymentId}`,
      );

      if (expected !== razorpaySignature) {
        return json(400, { success: false, error: "Invalid payment signature" });
      }

      // Verify payment status from Razorpay
      const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
      });

      if (!paymentRes.ok) {
        const errorText = await paymentRes.text();
        console.error("Razorpay payment fetch failed:", paymentRes.status, errorText);
        return json(502, { success: false, error: "Failed to verify payment with gateway" });
      }

      const payment = await paymentRes.json();

      if (payment.order_id !== razorpayOrderId) {
        return json(400, { success: false, error: "Payment does not match order" });
      }

      if (payment.status !== "captured" && payment.status !== "authorized") {
        return json(400, { success: false, error: `Payment not successful (status: ${payment.status})` });
      }

      // Lock room first (best-effort atomicity)
      const { data: lockedRoom, error: lockErr } = await supabaseAdmin
        .from("rooms")
        .update({
          booking: true,
          available: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId)
        .eq("available", true)
        .select("id")
        .maybeSingle();

      if (lockErr) {
        console.error("Room lock failed:", lockErr);
        return json(500, { success: false, error: "Failed to lock the room" });
      }

      if (!lockedRoom) {
        return json(409, { success: false, error: "Room is no longer available" });
      }

      // Mark token paid + confirmed
      const { error: bookingUpdateErr } = await supabaseAdmin
        .from("booking_requests")
        .update({
          token_paid: true,
          booking_stage: "confirmed",
          status: "approved",
        })
        .eq("id", bookingRequestId);

      if (bookingUpdateErr) {
        console.error("Booking request update failed:", bookingUpdateErr);

        // Rollback room lock (best-effort)
        await supabaseAdmin
          .from("rooms")
          .update({ booking: false, available: true, updated_at: new Date().toISOString() })
          .eq("id", roomId);

        return json(500, { success: false, error: "Failed to finalize booking after payment" });
      }

      return json(200, { success: true });
    }

    return json(400, { success: false, error: "Invalid action" });
  } catch (error) {
    console.error("Error in create-token-payment:", error);
    const msg = (error as Error)?.message ?? "Unknown error";
    return json(500, { success: false, error: "Token payment failed", debug: msg });
  }
});
