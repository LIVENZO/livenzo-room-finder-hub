import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const RequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('status'),
    deviceId: z.string().trim().min(16).max(200),
  }),
  z.object({
    action: z.literal('redeem'),
    deviceId: z.string().trim().min(16).max(200),
    billAmount: z.number().finite().positive().max(1_000_000),
  }),
]);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const hashDeviceId = async (deviceId: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(deviceId));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const createCouponCode = () =>
  `LIVE10-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Please sign in to redeem this offer.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Offer service is unavailable.' }, 500);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.slice('Bearer '.length);
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (claimsError || typeof userId !== 'string') {
      return jsonResponse({ error: 'Please sign in to redeem this offer.' }, 401);
    }

    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: 'Enter a valid bill amount.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: role, error: roleError } = await adminClient
      .from('user_role_assignments')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError || role?.role !== 'renter') {
      return jsonResponse({ error: 'This offer is available to renters only.' }, 403);
    }

    const deviceHash = await hashDeviceId(parsed.data.deviceId);
    const { data: existing, error: existingError } = await adminClient
      .from('restaurant_offer_redemptions')
      .select('id')
      .eq('device_fingerprint_hash', deviceHash)
      .maybeSingle();

    if (existingError) {
      console.error('Restaurant offer status error:', existingError.message);
      return jsonResponse({ error: 'Unable to check the offer right now.' }, 500);
    }

    if (existing) {
      return jsonResponse({ status: 'already_redeemed' });
    }

    if (parsed.data.action === 'status') {
      return jsonResponse({ status: 'available' });
    }

    const billAmount = Math.round(parsed.data.billAmount * 100) / 100;
    const discountAmount = Math.round(billAmount * 10) / 100;
    const couponCode = createCouponCode();
    const { error: insertError } = await adminClient
      .from('restaurant_offer_redemptions')
      .insert({
        device_fingerprint_hash: deviceHash,
        user_id: userId,
        bill_amount: billAmount,
        discount_amount: discountAmount,
        coupon_code: couponCode,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return jsonResponse({ status: 'already_redeemed' });
      }
      console.error('Restaurant offer redemption error:', insertError.message);
      return jsonResponse({ error: 'Unable to redeem the offer right now.' }, 500);
    }

    return jsonResponse({
      status: 'redeemed',
      couponCode,
      billAmount,
      discountAmount,
    });
  } catch (error) {
    console.error('Restaurant offer error:', error instanceof Error ? error.message : 'Unknown error');
    return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500);
  }
});