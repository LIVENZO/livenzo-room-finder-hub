import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const params = url.searchParams;

  const razorpayKeyId = params.get("key") || "";
  const orderId = params.get("order_id") || "";
  const amount = params.get("amount") || "0";
  const bookingRequestId = params.get("booking_request_id") || "";
  const roomId = params.get("room_id") || "";
  const name = params.get("name") || "";
  const email = params.get("email") || "";
  const phone = params.get("phone") || "";
  const token = params.get("token") || "";
  const appScheme = params.get("app_scheme") || "https://livenzo-room-finder-hub.lovable.app";

  const amountInRupees = (parseInt(amount) / 100).toLocaleString("en-IN");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Livenzo Payment</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      text-align: center;
    }
    .logo { font-size: 28px; font-weight: 700; color: #3B82F6; margin-bottom: 8px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .amount { font-size: 36px; font-weight: 700; color: #111; margin: 16px 0; }
    .amount-label { color: #888; font-size: 13px; }
    .status { margin-top: 24px; padding: 16px; border-radius: 12px; }
    .status.loading { background: #EFF6FF; color: #3B82F6; }
    .status.success { background: #F0FDF4; color: #16A34A; }
    .status.error { background: #FEF2F2; color: #DC2626; }
    .spinner {
      border: 3px solid #E5E7EB;
      border-top: 3px solid #3B82F6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      margin-top: 16px;
      text-decoration: none;
    }
    .btn-primary { background: #3B82F6; color: white; }
    .btn-outline { background: white; color: #3B82F6; border: 2px solid #3B82F6; }
  </style>
</head>
<body>
  <div class="container" id="main">
    <div class="logo">Livenzo</div>
    <div class="subtitle">Secure Room Booking Payment</div>
    <div class="amount-label">Amount to Pay</div>
    <div class="amount">₹${amountInRupees}</div>
    <div class="status loading" id="status">
      <div class="spinner"></div>
      <div>Opening payment gateway...</div>
    </div>
  </div>

  <script>
    const SUPABASE_URL = "${Deno.env.get("SUPABASE_URL") || ""}";
    const bookingRequestId = "${bookingRequestId}";
    const roomId = "${roomId}";
    const authToken = "${token}";
    const appScheme = "${appScheme}";

    function showStatus(type, message, showButton, buttonText, buttonAction) {
      const statusEl = document.getElementById('status');
      statusEl.className = 'status ' + type;
      let html = '<div>' + message + '</div>';
      if (showButton) {
        html += '<button class="btn ' + (type === 'success' ? 'btn-primary' : 'btn-outline') + '" onclick="' + buttonAction + '">' + buttonText + '</button>';
      }
      statusEl.innerHTML = html;
    }

    async function verifyPayment(paymentId, orderId, signature) {
      showStatus('loading', '<div class="spinner"></div><div>Verifying payment...</div>');
      try {
        const res = await fetch(SUPABASE_URL + '/functions/v1/create-token-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({
            action: 'verify_payment',
            bookingRequestId: bookingRequestId,
            roomId: roomId,
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId,
            razorpaySignature: signature
          })
        });
        const data = await res.json();
        if (data.success) {
          showStatus('success', '✅ Payment Successful!<br>Your room is now locked.', true, 'Return to App', 'returnToApp("success")');
        } else {
          showStatus('error', '❌ Verification failed.<br>' + (data.error || ''), true, 'Return to App', 'returnToApp("failed")');
        }
      } catch (e) {
        showStatus('error', '❌ Verification error.<br>Please check in the app.', true, 'Return to App', 'returnToApp("failed")');
      }
    }

    function returnToApp(status) {
      // Try deep link first, then fallback to web URL
      const deepLink = appScheme + '?payment_status=' + status + '&booking_id=' + bookingRequestId;
      window.location.href = deepLink;
    }

    function openRazorpay() {
      const options = {
        key: "${razorpayKeyId}",
        amount: ${amount},
        currency: "INR",
        name: "Livenzo",
        description: "Room Booking Confirmation Fee",
        order_id: "${orderId}",
        prefill: {
          name: "${name}",
          email: "${email}",
          contact: "${phone}"
        },
        handler: function(response) {
          verifyPayment(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
        },
        modal: {
          ondismiss: function() {
            showStatus('error', 'Payment was cancelled.', true, 'Try Again', 'openRazorpay()', );
            const statusEl = document.getElementById('status');
            statusEl.innerHTML += '<br><button class="btn btn-outline" style="margin-left:8px" onclick="returnToApp(\\'cancelled\\')">Return to App</button>';
          }
        },
        theme: { color: "#3B82F6" }
      };

      try {
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function(response) {
          showStatus('error', '❌ Payment failed.<br>' + (response.error.description || ''), true, 'Try Again', 'openRazorpay()');
          const statusEl = document.getElementById('status');
          statusEl.innerHTML += '<br><button class="btn btn-outline" style="margin-top:8px" onclick="returnToApp(\\'failed\\')">Return to App</button>';
        });
        rzp.open();
      } catch(e) {
        showStatus('error', 'Failed to open payment gateway.', true, 'Return to App', 'returnToApp("failed")');
      }
    }

    // Auto-open Razorpay after page loads
    window.addEventListener('load', function() {
      setTimeout(openRazorpay, 500);
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
});
