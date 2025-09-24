import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EventType = 'notice' | 'document' | 'complaint';

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
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY not found in environment variables');
      return new Response(JSON.stringify({ error: 'FCM server key not configured' }), {
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
      data.deep_link_url = `https://livenzo-room-finder-hub.lovable.app/notice?id=${record.id}`;
    } else if (type === 'document') {
      targetUserId = record.owner_id ?? null;
      title = 'Document Uploaded';
      body = 'A renter uploaded a document for you to review.';
      data.document_id = record.id;
      data.deep_link_url = `https://livenzo-room-finder-hub.lovable.app/documents?id=${record.id}`;
    } else if (type === 'complaint') {
      targetUserId = record.owner_id ?? null;
      title = 'New Complaint';
      const complaintTitle = record.title ? String(record.title) : undefined;
      body = complaintTitle ? `A renter submitted a new complaint: ${complaintTitle}` : 'A renter submitted a new complaint.';
      data.complaint_id = record.id;
      data.deep_link_url = `https://livenzo-room-finder-hub.lovable.app/complaints?id=${record.id}`;
    }

    if (!targetUserId) {
      console.error('No target user id resolved from record:', { type, record });
      return new Response(JSON.stringify({ error: 'No target user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', targetUserId);

    if (tokenError) {
      console.error('Error fetching FCM tokens:', tokenError);
      return new Response(JSON.stringify({ error: 'Failed to fetch FCM tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for user:', targetUserId);
      return new Response(JSON.stringify({ message: 'No tokens for user' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = await Promise.all(tokens.map(async ({ token }) => {
      try {
        const fcmPayload = {
          to: token,
          notification: {
            title,
            body
          },
          data: {
            deep_link_url: data.deep_link_url,
            type: data.type || type,
            notification_id: data.notice_id || data.document_id || data.complaint_id || 'unknown',
            ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          }
        };

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
        return { success: true, result };
      } catch (error) {
        console.error('Error sending FCM message:', error);
        return { success: false, error: String(error) };
      }
    }));

    const successCount = results.filter(r => r.success).length;
    console.log(`Sent ${successCount}/${tokens.length} notifications for user ${targetUserId}`);

    return new Response(JSON.stringify({ successCount, results }), {
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