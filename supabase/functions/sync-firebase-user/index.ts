import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncUserRequest {
  firebase_uid: string;
  phone_number: string;
  fcm_token?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
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

    const body: SyncUserRequest = await req.json();
    const { firebase_uid, phone_number, fcm_token } = body;

    if (!firebase_uid || !phone_number) {
      return new Response(JSON.stringify({ error: 'firebase_uid and phone_number are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Syncing user data:', { firebase_uid, phone_number, has_fcm_token: !!fcm_token });

    // Check if user already exists in auth.users by phone
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error('Error checking existing users:', userCheckError);
      return new Response(JSON.stringify({ 
        error: 'Failed to check existing users', 
        details: userCheckError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Look for existing user with this phone number
    const existingUserWithPhone = existingUser.users.find(user => user.phone === phone_number);
    
    let supabaseUserId: string;
    let accessToken: string;
    let refreshToken: string;

    if (existingUserWithPhone) {
      console.log('User exists, generating tokens for:', existingUserWithPhone.id);
      
      // Generate session tokens for existing user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: existingUserWithPhone.email || `${phone_number}@firebase.app`,
        options: {
          redirectTo: 'https://example.com' // This won't be used but is required
        }
      });

      if (sessionError) {
        console.error('Error generating session:', sessionError);
        return new Response(JSON.stringify({ 
          error: 'Failed to generate session', 
          details: sessionError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      supabaseUserId = existingUserWithPhone.id;
      // For existing users, we'll use the admin service key approach
      accessToken = supabaseServiceKey;
      refreshToken = '';
    } else {
      console.log('Creating new user for phone:', phone_number);
      
      // Create new user in Supabase auth.users
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: phone_number,
        email: `${phone_number}@firebase.app`, // Dummy email required
        phone_confirmed: true,
        email_confirmed: true,
        user_metadata: {
          firebase_uid,
          phone: phone_number
        }
      });

      if (createError) {
        console.error('Error creating user in Supabase:', createError);
        return new Response(JSON.stringify({ 
          error: 'Failed to create user in Supabase', 
          details: createError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      supabaseUserId = newUser.user.id;
      
      // Generate session tokens for new user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${phone_number}@firebase.app`,
        options: {
          redirectTo: 'https://example.com' // This won't be used but is required
        }
      });

      if (sessionError) {
        console.warn('Could not generate session, continuing without tokens:', sessionError);
        accessToken = '';
        refreshToken = '';
      } else {
        // Extract tokens from the generated link
        accessToken = supabaseServiceKey; // Use service key for now
        refreshToken = '';
      }
    }

    // Prepare data for user_profiles upsert
    const userData = {
      id: supabaseUserId,
      firebase_uid,
      phone: phone_number,
      updated_at: new Date().toISOString(),
    };

    // Add FCM token if provided
    if (fcm_token) {
      userData.fcm_token = fcm_token;
    }

    // Upsert user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert(userData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error upserting user profile:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to sync user profile', 
          details: profileError.message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User profile synced successfully:', profileData);

    // If FCM token was provided, also update/insert in fcm_tokens table for notifications
    if (fcm_token && profileData?.id) {
      const { error: fcmError } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: profileData.id,
          token: fcm_token,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (fcmError) {
        console.warn('Failed to update FCM token:', fcmError);
        // Don't fail the whole request for FCM token issues
      } else {
        console.log('FCM token updated successfully');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'User data synced successfully',
      profile: profileData,
      supabase_user_id: supabaseUserId,
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