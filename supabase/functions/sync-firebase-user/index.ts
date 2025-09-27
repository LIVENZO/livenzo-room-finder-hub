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
        email_confirm: true,
        phone_confirm: true,
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
        phone_confirm: true,
        email_confirm: true,
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

    // Save FCM token using safe database function (non-blocking) - ignore if user_id is null
    if (fcm_token && supabaseUserId) {
      console.log('🔥 Saving FCM token for user in sync-firebase-user:', supabaseUserId);
      
      try {
        const { data: fcmData, error: fcmErr } = await admin.rpc('upsert_fcm_token_safe', {
          p_user_id: supabaseUserId,
          p_token: fcm_token
        });
        
        if (fcmErr) {
          console.error('❌ Failed to save FCM token via RPC in sync-firebase-user:', {
            error: fcmErr.message,
            code: fcmErr.code,
            user_id: supabaseUserId
          });
          
          // Fallback to direct upsert
          console.log('🔄 Attempting fallback upsert in sync-firebase-user...');
          const { error: fallbackErr } = await admin
            .from('fcm_tokens')
            .upsert(
              [{ user_id: supabaseUserId, token: fcm_token, created_at: new Date().toISOString() }],
              { onConflict: 'user_id', ignoreDuplicates: false }
            );
          
          if (fallbackErr) {
            console.error('❌ Fallback FCM upsert also failed:', fallbackErr);
          } else {
            console.log('✅ FCM token saved via fallback in sync-firebase-user');
          }
        } else {
          console.log('✅ FCM token saved via RPC in sync-firebase-user:', {
            user_id: supabaseUserId,
            token: fcm_token.substring(0, 20) + '...'
          });
        }
      } catch (error) {
        console.error('💥 Exception saving FCM token in sync-firebase-user:', error);
      }
    }

    // Generate session tokens using admin API for phone-authenticated users
    console.log('Generating session tokens for user:', supabaseUserId);
    
    // Use magiclink generation to create valid tokens
    const { data: sessionData, error: sessionErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: upsertedEmail,
    });

    if (sessionErr || !sessionData) {
      console.error('generateLink error:', sessionErr);
      return new Response(JSON.stringify({ 
        error: 'Failed to create session for user',
        details: sessionErr?.message || 'Session generation failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse access and refresh tokens from the generated link
    console.log('Magic link generated successfully');
    const linkUrl = new URL(sessionData.properties.action_link);
    const accessToken = linkUrl.searchParams.get('access_token');
    const refreshToken = linkUrl.searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      console.error('Failed to extract tokens from magic link:', linkUrl.href);
      return new Response(JSON.stringify({ 
        error: 'Failed to extract session tokens',
        details: 'Invalid magic link format'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'User synced successfully',
      supabase_user_id: supabaseUserId,
      profile,
      access_token: accessToken,
      refresh_token: refreshToken
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