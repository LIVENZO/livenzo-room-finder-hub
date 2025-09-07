import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')!;

    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY not found in environment variables');
      return new Response(JSON.stringify({ error: 'FCM server key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, data }: NotificationPayload = await req.json();

    console.log('Sending notification to user:', userId, { title, body });

    // Get user's FCM tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokenError) {
      console.error('Error fetching FCM tokens:', tokenError);
      return new Response(JSON.stringify({ error: 'Failed to fetch FCM tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for user:', userId);
      return new Response(JSON.stringify({ message: 'No FCM tokens found for user' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send notification to all user's devices
    const notifications = tokens.map(async ({ token }) => {
      try {
        const fcmPayload = {
          to: token,
          notification: {
            title,
            body,
            icon: '/android-chrome-192x192.png', // Default icon
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          }
        };

        console.log('Sending FCM message to token:', token.substring(0, 20) + '...');

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fcmPayload),
        });

        const result = await response.json();
        
        if (!response.ok) {
          console.error('FCM send failed:', result);
          return { success: false, error: result };
        }

        console.log('FCM send successful:', result);
        return { success: true, result };
      } catch (error) {
        console.error('Error sending FCM message:', error);
        return { success: false, error: error.message };
      }
    });

    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r.success).length;

    console.log(`Sent notifications to ${successCount}/${tokens.length} devices`);

    return new Response(JSON.stringify({ 
      message: `Notifications sent to ${successCount}/${tokens.length} devices`,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});