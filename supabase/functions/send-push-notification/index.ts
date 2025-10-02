import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to base64url encode
const base64urlEncode = (data: string): string => {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Helper function to decode base64
const base64Decode = (data: string): Uint8Array => {
  const binaryString = atob(data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper function to create JWT for Google OAuth
const createJWT = async (clientEmail: string, privateKey: string, scope: string): Promise<string> => {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  const data = `${encodedHeader}.${encodedPayload}`;
  
  // Clean and decode the private key
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
    
  const keyBytes = base64Decode(keyData);
  
  // Create a proper ArrayBuffer for the key import
  const keyBuffer = new ArrayBuffer(keyBytes.length);
  const keyView = new Uint8Array(keyBuffer);
  keyView.set(keyBytes);
  
  // Import the key for signing
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(data)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${data}.${encodedSignature}`;
};

// Helper function to get OAuth access token
const getAccessToken = async (clientEmail: string, privateKey: string): Promise<string> => {
  const jwt = await createJWT(clientEmail, privateKey, 'https://www.googleapis.com/auth/firebase.messaging');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
};

type EventType = 'notice' | 'document' | 'complaint' | 'payment_reminder' | 'connection_request';

interface IncomingPayload {
  type: EventType;
  record: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firebaseServiceAccount = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!firebaseServiceAccount) {
      console.error('FIREBASE_SERVICE_ACCOUNT not found in environment variables');
      return new Response(JSON.stringify({ error: 'Firebase service account not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the Firebase service account JSON
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(firebaseServiceAccount);
    } catch (error) {
      console.error('Invalid Firebase service account JSON:', error);
      return new Response(JSON.stringify({ error: 'Invalid Firebase service account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, record }: IncomingPayload = await req.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine target user and notification content
    let targetUserId: string | null = null;
    let title: string = '';
    let body: string = '';
    let data: Record<string, any> = { source: 'send-push-notification', type };

    if (type === 'notice') {
      targetUserId = record.renter_id ?? null;
      title = 'New Notice from Owner';
      const noticeTitle = record.title ? String(record.title) : undefined;
      const noticeMsg = record.message ? String(record.message) : undefined;
      body = noticeTitle
        ? `Your owner sent a notice: ${noticeTitle}`
        : (noticeMsg ? `Your owner sent a notice: ${noticeMsg.substring(0, 100)}` : 'Your owner sent a notice.');
      data.notice_id = record.id;
      data.deep_link_url = `https://livenzo-room-finder-hub.lovable.app/notices?id=${record.id}`;
    } else if (type === 'document') {
      targetUserId = record.owner_id ?? null;
      title = 'Document Uploaded';
      body = 'A renter uploaded a document for you to review.';
      data.document_id = record.id;
      data.deep_link_url = `https://livenzo-room-finder-hub.lovable.app/connections?showDocuments=true&documentId=${record.id}`;
    } else if (type === 'complaint') {
      targetUserId = record.owner_id ?? null;
      title = 'New Complaint';
      const complaintTitle = record.title ? String(record.title) : undefined;
      body = complaintTitle ? `A renter submitted a new complaint: ${complaintTitle}` : 'A renter submitted a new complaint.';
      data.complaint_id = record.id;
      data.deep_link_url = `https://livenzo-room-finder-hub.lovable.app/connections?showComplaints=true&complaintId=${record.id}`;
    } else if (type === 'payment_reminder') {
      targetUserId = record.renter_id ?? null;
      title = '⚠️ Payment Reminder';
      body = record.message || '⚠️ Your rent is pending. Please complete your payment.';
      data.payment_reminder_id = record.relationship_id;
      data.amount = record.amount;
      data.deep_link_url = record.deep_link_url || 'https://livenzo-room-finder-hub.lovable.app/payments';
    } else if (type === 'connection_request') {
      targetUserId = record.owner_id ?? null;
      title = '🔔 New Connection Request';
      body = 'A renter wants to connect with you. Review their request now.';
      data.relationship_id = record.id;
      data.renter_id = record.renter_id;
      data.deep_link_url = `https://livenzo-room-finder-hub.lovable.app/connections?tab=requests`;
    }

    if (!targetUserId) {
      console.error('No target user id resolved from record:', { type, record });
      return new Response(JSON.stringify({ error: 'No target user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch tokens from both fcm_tokens table and user_profiles (for backward compatibility)
    console.log('🔍 Fetching FCM tokens for user:', targetUserId);
    
    const { data: tokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', targetUserId);

    // Also check user_profiles for legacy token storage
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('fcm_token')
      .eq('id', targetUserId)
      .single();

    let allTokens: string[] = [];
    
    // Add tokens from fcm_tokens table
    if (tokens && tokens.length > 0) {
      allTokens = tokens.map(t => t.token).filter(Boolean);
    }
    
    // Add token from user_profiles if not already included
    if (profile?.fcm_token && !allTokens.includes(profile.fcm_token)) {
      allTokens.push(profile.fcm_token);
    }

    console.log(`📋 Debug info: {
  profileToken: ${profile?.fcm_token ? 'found' : null},
  legacyTokensCount: ${tokens?.length || 0},
  profileQueryError: ${profileError?.message || undefined},
  tokensQueryError: ${tokenError?.message || undefined}
}`);

    if (tokenError) {
      console.warn('⚠️ Error fetching FCM tokens from fcm_tokens:', tokenError.message);
    }

    if (profileError) {
      console.warn('⚠️ Error fetching FCM token from user_profiles:', profileError.message);
    }

    if (allTokens.length === 0) {
      console.error(`❌ No FCM token found for user ${targetUserId}`);
      return new Response(JSON.stringify({ 
        error: 'No FCM tokens found',
        user_id: targetUserId,
        debug: {
          fcm_tokens_count: tokens?.length || 0,
          profile_token_exists: !!profile?.fcm_token
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📨 [FCM V1] Sending to ${allTokens.length} device(s)`);

    // Insert debug notification record into DB (for visibility and deep link verification)
    try {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title,
          message: body,
          deep_link_url: data.deep_link_url || null,
          is_read: false
        });
      if (insertError) {
        console.warn('⚠️ Failed to insert debug notification record:', insertError.message);
      } else {
        console.log('🧾 Debug notification record inserted');
      }
    } catch (e) {
      console.warn('⚠️ Exception inserting debug notification record:', e);
    }

    // Get OAuth access token for FCM V1 API
    console.log('🔑 Getting OAuth access token...');
    const accessToken = await getAccessToken(serviceAccount.client_email, serviceAccount.private_key);
    console.log('✅ [FCM V1] OAuth token obtained successfully');

    const results = await Promise.all(allTokens.map(async (token) => {
      try {
        console.log('→ [FCM V1] Sending to token:', token.substring(0, 20) + '...');
        
        // Send DATA-ONLY message so Android service handles tap reliably
        const fcmPayload = {
          message: {
            token,
            data: {
              title,
              body,
              deep_link_url: String(data.deep_link_url || ''),
              type: String(data.type || type),
              notification_id: String(data.notice_id || data.document_id || data.complaint_id || 'unknown'),
              ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
              click_action: 'OPEN_APP'
            },
            android: {
              priority: 'high'
            }
          }
        };

        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fcmPayload),
        });

        const result = await response.json();
        if (!response.ok) {
          console.error('❌ [FCM V1] Send failed:', result);
          return { success: false, error: result };
        }
        
        console.log('✅ [FCM V1] Send successful:', result);
        return { success: true, result };
      } catch (error) {
        console.error('❌ Error sending FCM V1 message:', error);
        return { success: false, error: String(error) };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 [FCM V1] Final result: ${successCount}/${allTokens.length} notifications sent successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      successCount, 
      totalTokens: allTokens.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});