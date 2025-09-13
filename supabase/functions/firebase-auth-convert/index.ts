import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirebaseAuthRequest {
  firebaseIdToken: string;
  selectedRole?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { firebaseIdToken, selectedRole = 'renter' }: FirebaseAuthRequest = await req.json();

    if (!firebaseIdToken) {
      return new Response(JSON.stringify({ error: 'Firebase ID token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing Firebase ID token for Supabase conversion:', { selectedRole });

    // Use Supabase GoTrue token exchange with grant_type=id_token
    const tokenExchangeUrl = `${supabaseUrl}/auth/v1/token?grant_type=id_token`;
    const tokenResponse = await fetch(tokenExchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
      },
      body: JSON.stringify({
        id_token: firebaseIdToken,
        provider: 'firebase',
        user_metadata: {
          role: selectedRole
        }
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange Firebase token:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to exchange Firebase token for Supabase session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const tokenResult = await tokenResponse.json();
    console.log('Token exchange successful');

    // Extract user info from the Firebase ID token
    let phoneNumber = null;
    let firebaseUid = null;
    try {
      const payload = JSON.parse(atob(firebaseIdToken.split('.')[1]));
      phoneNumber = payload.phone_number;
      firebaseUid = payload.sub;
    } catch (e) {
      console.warn('Could not parse Firebase ID token payload:', e);
    }

    // Store user role assignment if we have the user
    if (tokenResult.user?.id) {
      const { error: roleError } = await supabase
        .from('user_role_assignments')
        .upsert({
          user_id: tokenResult.user.id,
          role: selectedRole
        }, {
          onConflict: 'user_id'
        });

      if (roleError) {
        console.error('Error creating role assignment:', roleError);
      }

      // Store Firebase mapping if we have the Firebase UID
      if (firebaseUid) {
        const { error: mappingError } = await supabase
          .from('firebase_user_mappings')
          .upsert({
            supabase_user_id: tokenResult.user.id,
            firebase_uid: firebaseUid,
            phone_number: phoneNumber
          }, {
            onConflict: 'firebase_uid'
          });

        if (mappingError) {
          console.error('Error creating Firebase mapping:', mappingError);
        }
      }
    }

    return new Response(JSON.stringify({
      access_token: tokenResult.access_token,
      refresh_token: tokenResult.refresh_token,
      user: tokenResult.user
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Firebase auth conversion error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});