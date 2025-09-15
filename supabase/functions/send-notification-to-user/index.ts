import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  firebase_uid?: string;
  user_id?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
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
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')!;
    
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

    const body: NotificationRequest = await req.json();
    const { firebase_uid, user_id, title, body: messageBody, data } = body;

    if (!firebase_uid && !user_id) {
      return new Response(JSON.stringify({ error: 'Either firebase_uid or user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!title || !messageBody) {
      return new Response(JSON.stringify({ error: 'title and body are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Sending notification:', { firebase_uid, user_id, title });

    // Get user's FCM token
    let fcmToken: string | null = null;
    
    if (firebase_uid) {
      // Find user by firebase_uid and get FCM token
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, fcm_token')
        .eq('firebase_uid', firebase_uid)
        .single();

      if (profileError) {
        console.error('Error finding user profile:', profileError);
        return new Response(
          JSON.stringify({ 
            error: 'User not found', 
            details: profileError.message 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      fcmToken = profileData?.fcm_token;
    } else if (user_id) {
      // Find FCM token by user_id
      const { data: tokenData, error: tokenError } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('user_id', user_id)
        .single();

      if (tokenError) {
        console.error('Error finding FCM token:', tokenError);
        return new Response(
          JSON.stringify({ 
            error: 'FCM token not found', 
            details: tokenError.message 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      fcmToken = tokenData?.token;
    }

    if (!fcmToken) {
      return new Response(JSON.stringify({ error: 'No FCM token found for user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send FCM notification
    const fcmPayload = {
      to: fcmToken,
      notification: {
        title: title,
        body: messageBody,
        sound: 'default',
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channel_id: 'livenzo_notifications',
        },
      },
    };

    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmPayload),
    });

    const fcmResult = await fcmResponse.json();

    if (fcmResponse.ok && fcmResult.success === 1) {
      console.log('Notification sent successfully:', fcmResult);
      return new Response(JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        fcm_result: fcmResult
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.error('Failed to send notification:', fcmResult);
      return new Response(JSON.stringify({
        error: 'Failed to send notification',
        details: fcmResult
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Send notification error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});