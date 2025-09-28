import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncUserRequest {
  firebase_uid: string;
  phone_number: string;
  id_token: string;
  fcm_token?: string | null;
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

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body: SyncUserRequest = await req.json();
    const { firebase_uid, phone_number, id_token, fcm_token } = body;

    if (!firebase_uid || !phone_number || !id_token) {
      return new Response(JSON.stringify({ error: 'firebase_uid, phone_number, and id_token are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔄 Starting Firebase OIDC sync:', { 
      firebase_uid, 
      phone_number, 
      has_id_token: !!id_token,
      has_fcm_token: !!fcm_token 
    });

    // Use Firebase OIDC flow with Supabase
    console.log('🔑 Attempting Firebase OIDC login with Supabase...');
    
    const { data: authData, error: authError } = await publicClient.auth.signInWithIdToken({
      provider: 'firebase',
      token: id_token
    });

    if (authError || !authData?.session) {
      console.error('❌ Firebase OIDC login failed:', authError);
      return new Response(JSON.stringify({ 
        error: 'Firebase ID token verification failed', 
        details: authError?.message || 'Invalid or expired token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUserId = authData.user.id;
    console.log('✅ Firebase OIDC login successful, user ID:', supabaseUserId);

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

    console.log('✅ Firebase OIDC sync completed successfully:', supabaseUserId);

    return new Response(JSON.stringify({
      success: true,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user: {
          id: supabaseUserId,
          phone: phone_number,
          firebase_uid: firebase_uid
        }
      }
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