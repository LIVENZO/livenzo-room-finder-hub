import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirebaseAuthRequest {
  firebaseUid: string;
  phoneNumber: string;
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

    const { firebaseUid, phoneNumber, selectedRole = 'renter' }: FirebaseAuthRequest = await req.json();

    if (!firebaseUid || !phoneNumber) {
      return new Response(JSON.stringify({ error: 'Firebase UID and phone number are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing Firebase auth for:', { firebaseUid, phoneNumber, selectedRole });

  // Check if Firebase UID already exists
  const { data: existingMapping } = await supabase
    .from('firebase_user_mappings')
    .select('supabase_user_id')
    .eq('firebase_uid', firebaseUid)
    .single();

  let supabaseUserId: string;

  if (existingMapping) {
    // User already exists, use existing Supabase user ID
    supabaseUserId = existingMapping.supabase_user_id;
    console.log('Found existing user mapping:', supabaseUserId);
  } else {
    // Create new Supabase user via admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      phone: phoneNumber,
      phone_confirmed: true,
      user_metadata: {
        role: selectedRole,
        firebase_uid: firebaseUid
      }
    });

    if (createError || !newUser.user) {
      console.error('Error creating Supabase user:', createError);
      return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    supabaseUserId = newUser.user.id;
    console.log('Created new Supabase user:', supabaseUserId);

    // Create Firebase UID mapping
    const { error: mappingError } = await supabase
      .from('firebase_user_mappings')
      .insert({
        supabase_user_id: supabaseUserId,
        firebase_uid: firebaseUid,
        phone_number: phoneNumber
      });

    if (mappingError) {
      console.error('Error creating Firebase mapping:', mappingError);
      // Continue anyway as user is created
    }

    // Create user role assignment (without email for phone-only users)
    const { error: roleError } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: supabaseUserId,
        role: selectedRole
      });

    if (roleError) {
      console.error('Error creating role assignment:', roleError);
      // Continue anyway
    }
  }

  // Create session for the user directly using GoTrue Admin API
  try {
    // Make direct call to create session
    const createSessionUrl = `${supabaseUrl}/auth/v1/admin/users/${supabaseUserId}/session`;
    const createSessionResponse = await fetch(createSessionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({})
    });

    if (!createSessionResponse.ok) {
      const errorText = await createSessionResponse.text();
      console.error('Failed to create session:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sessionResult = await createSessionResponse.json();
    const { access_token, refresh_token } = sessionResult;

    if (!access_token || !refresh_token) {
      console.error('No tokens returned from session creation');
      return new Response(JSON.stringify({ error: 'Failed to generate valid session tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Successfully created session for phone-only user');

    return new Response(JSON.stringify({
      access_token,
      refresh_token,
      user: {
        id: supabaseUserId,
        phone: phoneNumber,
        role: selectedRole
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (sessionError) {
    console.error('Error creating session:', sessionError);
    return new Response(JSON.stringify({ error: 'Failed to create user session' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  } catch (error) {
    console.error('Firebase auth conversion error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});