import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Notice webhook received:', payload);

    // Extract notice data from webhook payload
    const notice = payload.record;
    
    if (!notice) {
      console.error('No notice data in payload');
      return new Response(JSON.stringify({ error: 'No notice data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get renter profile info for notification
    const { data: renterProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', notice.renter_id)
      .single();

    const renterName = renterProfile?.full_name || 'Renter';

    // Send notification to the renter
    const notificationResponse = await supabase.functions.invoke('send-notification', {
      body: {
        userId: notice.renter_id,
        title: 'New Notice from Owner',
        body: notice.message.length > 100 
          ? notice.message.substring(0, 100) + '...' 
          : notice.message,
        type: 'notice',
        data: {
          type: 'notice',
          notice_id: notice.id,
          owner_id: notice.owner_id,
          message: notice.message
        }
      }
    });

    if (notificationResponse.error) {
      console.error('Error sending notification:', notificationResponse.error);
    } else {
      console.log('Notification sent successfully for notice:', notice.id);
    }

    return new Response(JSON.stringify({ 
      message: 'Notice notification processed',
      notice_id: notice.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-notice-created function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});