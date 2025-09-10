import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type JsonRecord = Record<string, unknown>;

interface NotificationPayload {
  userId: string; // target user id (UUID)
  title: string;
  body: string;
  data?: JsonRecord;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Support both env names to avoid configuration mismatch
    const firebaseServerKey = Deno.env.get('FIREBASE_SERVER_KEY') || Deno.env.get('FCM_SERVER_KEY');

    if (!firebaseServerKey) {
      console.error('❌ No FCM server key configured (FIREBASE_SERVER_KEY or FCM_SERVER_KEY)');
      return new Response(JSON.stringify({ error: 'FCM server key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { userId, title, body, data } = payload;

    if (!userId) {
      console.error('❌ No userId provided');
      return new Response(JSON.stringify({ error: 'No userId provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('➡️ Preparing to send notification', { userId, title, body, data });

    // 1) Try to get a single fcm_token from user_profiles
    const { data: profileRows, error: profileErr } = await supabase
      .from('user_profiles')
      .select('fcm_token')
      .eq('id', userId)
      .limit(1);

    if (profileErr) {
      console.error('Error querying user_profiles:', profileErr);
    }

    const profileToken = profileRows?.[0]?.fcm_token as string | null | undefined;

    // 2) Fallback to legacy fcm_tokens table (in case multiple devices are supported)
    let legacyTokens: string[] = [];
    const { data: tokensRows, error: tokensErr } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokensErr) {
      console.error('Error querying fcm_tokens:', tokensErr);
    } else {
      legacyTokens = (tokensRows || []).map((r: { token: string }) => r.token).filter(Boolean);
    }

    // Build final list of tokens to notify
    const tokens = [profileToken, ...legacyTokens].filter((t): t is string => !!t);

    if (!tokens.length) {
      console.error('❌ No FCM token provided or found for user', userId);
      return new Response(JSON.stringify({ error: 'No FCM token provided' }), {
        status: 200, // Not an internal error; nothing to send
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📨 Sending to ${tokens.length} device(s)`);

    const notifications = tokens.map(async (token) => {
      try {
        const fcmPayload = {
          to: token,
          notification: {
            title,
            body,
            icon: '/android-chrome-192x192.png',
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          data: {
            ...(data || {}),
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          }
        } as const;

        console.log('→ FCM request for token:', token.substring(0, 20) + '...');

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${firebaseServerKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fcmPayload),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('FCM send failed:', result);
          return { success: false, error: result };
        }

        console.log('✅ FCM send successful:', result);
        return { success: true, result };
      } catch (error) {
        console.error('Error sending FCM message:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r.success).length;

    console.log(`📊 Sent notifications to ${successCount}/${tokens.length} devices`);

    return new Response(JSON.stringify({
      message: `Notifications sent to ${successCount}/${tokens.length} devices`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unhandled error in send-notification function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
