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
    console.log('Chat message webhook received:', payload);

    // Extract message data from webhook payload
    const message = payload.record;
    
    if (!message) {
      console.error('No message data in payload');
      return new Response(JSON.stringify({ error: 'No message data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get sender profile info for notification
    const { data: senderProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', message.sender_id)
      .single();

    const senderName = senderProfile?.full_name || 'Someone';

    // Determine notification content based on message length
    let messageBody = message.message;
    if (messageBody.length > 100) {
      messageBody = messageBody.substring(0, 100) + '...';
    }

    // Send notification to the receiver
    const notificationResponse = await supabase.functions.invoke('send-notification', {
      body: {
        userId: message.receiver_id,
        title: `New message from ${senderName}`,
        body: messageBody,
        type: 'chat_message',
        data: {
          type: 'chat_message',
          message_id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          relationship_id: message.relationship_id,
          room_id: message.room_id,
          message: message.message
        }
      }
    });

    if (notificationResponse.error) {
      console.error('Error sending notification:', notificationResponse.error);
    } else {
      console.log('Notification sent successfully for message:', message.id);
    }

    return new Response(JSON.stringify({ 
      message: 'Chat message notification processed',
      message_id: message.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-chat-message function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});