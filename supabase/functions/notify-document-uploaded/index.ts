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
    console.log('Document webhook received:', payload);

    // Extract document data from webhook payload
    const document = payload.record;
    
    if (!document) {
      console.error('No document data in payload');
      return new Response(JSON.stringify({ error: 'No document data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get relationship to find the owner
    const { data: relationship, error: relationshipError } = await supabase
      .from('relationships')
      .select('owner_id, renter_id')
      .eq('id', document.relationship_id)
      .single();

    if (relationshipError || !relationship) {
      console.error('Error fetching relationship:', relationshipError);
      return new Response(JSON.stringify({ error: 'Relationship not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get renter profile info for notification
    const { data: renterProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', relationship.renter_id)
      .single();

    const renterName = renterProfile?.full_name || 'Renter';

    // Send notification to the owner
    const notificationResponse = await supabase.functions.invoke('send-notification', {
      body: {
        userId: relationship.owner_id,
        title: 'New Document Uploaded',
        body: `${renterName} uploaded a new ${document.document_type} document`,
        data: {
          type: 'document',
          document_id: document.id,
          document_type: document.document_type,
          renter_id: relationship.renter_id,
          relationship_id: document.relationship_id,
          file_name: document.file_name
        }
      }
    });

    if (notificationResponse.error) {
      console.error('Error sending notification:', notificationResponse.error);
    } else {
      console.log('Notification sent successfully for document:', document.id);
    }

    return new Response(JSON.stringify({ 
      message: 'Document notification processed',
      document_id: document.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-document-uploaded function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});