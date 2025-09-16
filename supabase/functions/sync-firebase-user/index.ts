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

    // Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, firebase_uid')
      .eq('firebase_uid', firebase_uid)
      .single();

    // Prepare data for upsert
    const userData: any = {
      firebase_uid,
      phone: phone_number,
      updated_at: new Date().toISOString(),
    };

    // Add FCM token if provided
    if (fcm_token) {
      userData.fcm_token = fcm_token;
    }

    // If this is a new user, generate a UUID for the id column
    if (!existingProfile) {
      userData.id = crypto.randomUUID();
    }

    // Upsert user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert(userData, {
        onConflict: 'firebase_uid',
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
      profile: profileData
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