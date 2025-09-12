import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

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

      // Create user role assignment
      const { error: roleError } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: supabaseUserId,
          email: phoneNumber, // Using phone as email placeholder
          role: selectedRole
        });

      if (roleError) {
        console.error('Error creating role assignment:', roleError);
        // Continue anyway
      }
    }

    // Generate Supabase session token
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      phone: phoneNumber,
      options: {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:3000'}/`
      }
    });

    if (sessionError || !sessionData.properties?.action_link) {
      console.error('Error generating session:', sessionError);
      return new Response(JSON.stringify({ error: 'Failed to generate session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract the token from the magic link
    const actionLink = sessionData.properties.action_link;
    const url = new URL(actionLink);
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      console.error('Failed to extract tokens from magic link');
      return new Response(JSON.stringify({ error: 'Failed to generate valid session tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Successfully processed Firebase auth, returning session tokens');

    return new Response(JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: supabaseUserId,
        phone: phoneNumber,
        role: selectedRole
      }
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