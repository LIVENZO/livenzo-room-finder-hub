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
  type?: string; // notification type to determine deep link
}

// Helper function to create JWT for Google OAuth
async function createJWT(clientEmail: string, privateKey: string, scope: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, // 1 hour
    iat: now,
  };

  // Base64url encode (without padding)
  const base64UrlEncode = (data: string): string => {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Parse the private key properly
  const keyData = privateKey.replace(/\\n/g, '\n');
  
  // Remove the header and footer from PEM
  const pemContents = keyData
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  
  // Convert to binary
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );

  // Base64url encode the signature
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  return `${signingInput}.${encodedSignature}`;
}

// Get OAuth access token
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const jwt = await createJWT(clientEmail, privateKey, 'https://www.googleapis.com/auth/firebase.messaging');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleProjectId = Deno.env.get('GOOGLE_PROJECT_ID');
    const googleClientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL');
    const googlePrivateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!googleProjectId || !googleClientEmail || !googlePrivateKey) {
      console.error('❌ Missing FCM V1 configuration: GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, or GOOGLE_PRIVATE_KEY');
      return new Response(JSON.stringify({ 
        error: 'FCM V1 configuration incomplete',
        details: 'Missing required Google service account credentials'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { userId, title, body, data, type } = payload;

    // Determine effective notification type and optional notice id
    const incomingType = typeof type === 'string' ? type : (typeof (data as any)?.type === 'string' ? String((data as any).type) : undefined);
    const effectiveType = incomingType || 'general';
    const noticeId = (data && (data as any).notice_id != null) ? String((data as any).notice_id) : undefined;

    const baseUrl = 'https://livenzo-room-finder-hub.lovable.app';

    // Map a type to a default path (used when specific id isn't required)
    function getDeepLinkPath(notificationType?: string): string {
      switch (notificationType) {
        case 'payment_delay':
        case 'payment_due':
          return '/payment';
        case 'notice':
        case 'owner_notice':
          return '/notice';
        case 'complaint':
        case 'complaint_update':
          return '/complaints';
        case 'document':
        case 'document_uploaded':
          return '/documents';
        case 'connection_request':
          return '/connection-requests';
        case 'chat_message':
          return '/chats';
        default:
          return '/dashboard';
      }
    }

    // Compute deep link URL; ensure notice uses the id param when available
    let deepLinkUrl = `${baseUrl}${getDeepLinkPath(effectiveType)}`;
    if (effectiveType === 'notice' && noticeId) {
      deepLinkUrl = `${baseUrl}/notice?id=${encodeURIComponent(noticeId)}`;
    }

    // Check for duplicate notifications within the last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const { data: existingNotifications, error: duplicateCheckError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .eq('message', body)
      .gte('created_at', thirtySecondsAgo)
      .limit(1);

    if (duplicateCheckError) {
      console.error('❌ Error checking for duplicate notifications:', duplicateCheckError);
    }

    // If a similar notification was sent in the last 30 seconds, skip sending
    if (existingNotifications && existingNotifications.length > 0) {
      console.log('⚠️ [FCM V1] Duplicate notification detected, skipping send:', {
        userId,
        title,
        existingCount: existingNotifications.length
      });
      return new Response(JSON.stringify({
        message: 'Duplicate notification skipped',
        userId: userId,
        duplicateDetected: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert notification record with deep_link_url and sent flag
    const { data: notificationData, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message: body,
        deep_link_url: deepLinkUrl,
        created_at: new Date().toISOString(),
        is_read: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting notification:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create notification record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build final data payload (all values must be strings for FCM)
    const baseData: Record<string, any> = { ...(data || {}) };
    const enrichedData: Record<string, any> = {
      ...baseData,
      type: effectiveType,
      ...(noticeId ? { notice_id: noticeId } : {}),
      deep_link_url: deepLinkUrl,
      notification_id: notificationData.id,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    };
    const finalData: Record<string, string> = Object.fromEntries(
      Object.entries(enrichedData).map(([k, v]) => [k, v == null ? '' : String(v)])
    );

    if (!userId) {
      console.error('❌ No userId provided');
      return new Response(JSON.stringify({ error: 'No userId provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('➡️ [FCM V1] Preparing to send notification', { userId, title, body, data });

    // 1) Try to get FCM token from user_profiles
    const { data: profileRows, error: profileErr } = await supabase
      .from('user_profiles')
      .select('fcm_token')
      .eq('id', userId)
      .limit(1);

    if (profileErr) {
      console.error('❌ Error querying user_profiles:', profileErr);
    }

    const profileToken = profileRows?.[0]?.fcm_token as string | null | undefined;

    // 2) Fallback to legacy fcm_tokens table
    let legacyTokens: string[] = [];
    const { data: tokensRows, error: tokensErr } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokensErr) {
      console.error('❌ Error querying fcm_tokens:', tokensErr);
    } else {
      legacyTokens = (tokensRows || []).map((r: { token: string }) => r.token).filter(Boolean);
    }

    // Build final list of tokens to notify
    const tokens = [profileToken, ...legacyTokens].filter((t): t is string => !!t);

    if (!tokens.length) {
      console.error('❌ No FCM token found for user', userId);
      console.log('📋 Debug info:', {
        profileToken,
        legacyTokensCount: legacyTokens.length,
        profileQueryError: profileErr?.message,
        tokensQueryError: tokensErr?.message
      });
      return new Response(JSON.stringify({ 
        error: 'No FCM token found',
        userId: userId,
        details: 'User has not registered for push notifications'
      }), {
        status: 200, // Not an internal error; user just hasn't registered
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📨 [FCM V1] Sending to ${tokens.length} device(s)`);

    // Get OAuth access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken(googleClientEmail, googlePrivateKey);
      console.log('✅ [FCM V1] OAuth token obtained successfully');
    } catch (error) {
      console.error('❌ [FCM V1] Failed to get OAuth token:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to authenticate with FCM',
        details: (error as Error).message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notifications = tokens.map(async (token) => {
      try {
        // FCM V1 API payload structure
        const fcmV1Payload = {
          message: {
            token: token,
            notification: {
              title: title,
              body: body,
            },
            data: finalData,
            android: {
              notification: {
                icon: 'notification_icon',
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
              }
            }
          }
        };

        console.log('→ [FCM V1] Sending to token:', token.substring(0, 20) + '...');

        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${googleProjectId}/messages:send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fcmV1Payload),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('❌ [FCM V1] Send failed:', {
            status: response.status,
            statusText: response.statusText,
            result
          });
          return { success: false, error: result, token: token.substring(0, 20) + '...' };
        }

        console.log('✅ [FCM V1] Send successful:', result);
        return { success: true, result, token: token.substring(0, 20) + '...' };
      } catch (error) {
        console.error('❌ [FCM V1] Exception sending message:', error);
        return { success: false, error: (error as Error).message, token: token.substring(0, 20) + '...' };
      }
    });

    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r.success).length;

    console.log(`📊 [FCM V1] Final result: ${successCount}/${tokens.length} notifications sent successfully`);

    return new Response(JSON.stringify({
      message: `[FCM V1] Notifications sent to ${successCount}/${tokens.length} devices`,
      success: successCount > 0,
      totalTokens: tokens.length,
      successCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [FCM V1] Unhandled error in send-notification function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
