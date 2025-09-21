import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncUserRequest {
  firebase_uid: string;
  phone_number: string;
  fcm_token?: string | null;
}

function generateTempPassword(length = 32) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_!@#$%^&*()';
  let result = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body: SyncUserRequest = await req.json();
    const { firebase_uid, phone_number, fcm_token } = body;

    if (!firebase_uid || !phone_number) {
      return new Response(JSON.stringify({ error: 'firebase_uid and phone_number are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const email = `${phone_number}@firebase.app`;
    const tempPassword = generateTempPassword();

    console.log('Syncing user:', { firebase_uid, phone_number, has_fcm_token: !!fcm_token });

    // Try to find existing user by phone via Admin API (paginate first 1000 users)
    const { data: list, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) {
      console.error('listUsers error:', listErr);
      return new Response(JSON.stringify({ error: 'Failed to check users', details: listErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let supabaseUserId: string | null = null;
    let upsertedEmail = email;

    const existing = list.users.find((u) => u.phone === phone_number);

    if (existing) {
      supabaseUserId = existing.id;
      // Ensure email is present and update password
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        email: existing.email ?? email,
        email_confirmed: true,
        phone_confirmed: true,
        password: tempPassword,
        user_metadata: { ...(existing.user_metadata || {}), firebase_uid, phone: phone_number }
      });
      if (updErr) {
        console.error('updateUserById error:', updErr);
        return new Response(JSON.stringify({ error: 'Failed to update user', details: updErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      upsertedEmail = existing.email ?? email;
    } else {
      // Create new user with confirmed phone/email and temp password
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        phone: phone_number,
        email,
        password: tempPassword,
        phone_confirmed: true,
        email_confirmed: true,
        user_metadata: { firebase_uid, phone: phone_number }
      });
      if (createErr) {
        console.error('createUser error:', createErr);
        return new Response(JSON.stringify({ error: 'Failed to create user', details: createErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      supabaseUserId = created.user.id;
    }

    // Upsert into user_profiles
    const profilePayload: Record<string, unknown> = {
      id: supabaseUserId,
      firebase_uid,
      phone: phone_number,
      updated_at: new Date().toISOString(),
    };

    if (fcm_token) {
      profilePayload.fcm_token = fcm_token;
    }

    const { data: profile, error: profileErr } = await admin
      .from('user_profiles')
      .upsert(profilePayload, { onConflict: 'id', ignoreDuplicates: false })
      .select()
      .maybeSingle();

    if (profileErr) {
      console.error('user_profiles upsert error:', profileErr);
      return new Response(JSON.stringify({ error: 'Failed to sync user profile', details: profileErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use upsert to handle FCM token conflicts (non-blocking)
    if (fcm_token && supabaseUserId) {
      const { data: fcmData, error: fcmErr } = await admin
        .from('fcm_tokens')
        .upsert([
          { user_id: supabaseUserId, token: fcm_token, created_at: new Date().toISOString() }
        ], { onConflict: ['user_id'] });
      
      if (fcmErr) {
        console.error('❌ Failed to save FCM token in sync-firebase-user:', {
          error: fcmErr.message,
          code: fcmErr.code,
          details: fcmErr.details,
          hint: fcmErr.hint,
          user_id: supabaseUserId,
          token_length: fcm_token.length
        });
      } else {
        console.log('✅ FCM token saved or updated successfully:', {
          user_id: supabaseUserId,
          token_length: fcm_token.length,
          data: fcmData
        });
      }
    }

    // Now create a user session and return tokens to the client
    const { data: signInData, error: signInErr } = await authClient.auth.signInWithPassword({
      email: upsertedEmail,
      password: tempPassword
    });

    if (signInErr || !signInData.session) {
      console.error('signInWithPassword error:', signInErr);
      return new Response(JSON.stringify({ error: 'Failed to create session for user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { access_token, refresh_token } = signInData.session;

    return new Response(JSON.stringify({
      success: true,
      message: 'User synced successfully',
      supabase_user_id: supabaseUserId,
      profile,
      access_token,
      refresh_token
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Sync user error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});