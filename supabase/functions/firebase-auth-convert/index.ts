import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirebaseAuthRequest {
  idToken?: string;
  firebaseIdToken?: string;
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

const body: FirebaseAuthRequest = await req.json();
const idToken = body.idToken ?? body.firebaseIdToken;
const selectedRole = body.selectedRole ?? 'renter';

if (!idToken) {
  return new Response(JSON.stringify({ error: 'ID token is required' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

    console.log('Processing Firebase ID token for Supabase conversion:', { selectedRole });

    // Sign in to Supabase using the Firebase ID token via signInWithIdToken
    console.log('Calling supabase.auth.signInWithIdToken with provider: firebase');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'firebase',
      token: idToken,
    });

    if (signInError) {
      console.error('signInWithIdToken error:', signInError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to exchange Firebase token for Supabase session', 
          details: signInError.message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signInData?.session || !signInData.session.access_token || !signInData.session.refresh_token) {
      console.error('No valid session returned from signInWithIdToken:', signInData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create session', 
          details: 'No session data returned from authentication' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('signInWithIdToken successful, session created');
    const tokenResult = {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      user: signInData.user
    };


    // Extract user info from the Firebase ID token
    let phoneNumber = null;
    let firebaseUid = null;
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
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