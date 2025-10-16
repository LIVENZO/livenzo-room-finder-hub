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
      .select('full_name, hostel_pg_name')
      .eq('id', relationship.renter_id)
      .single();

    // Prefer full_name for renters, fallback to hostel_pg_name
    const renterName = renterProfile?.full_name || renterProfile?.hostel_pg_name || 'Renter';

    // Send notification to the owner with emoji and deep link
    const notificationResponse = await supabase.functions.invoke('send-notification', {
      body: {
        userId: relationship.owner_id,
        title: '📄 New Document Received!',
        body: `Your renter ${renterName} has uploaded a new document. Tap to view now!`,
        type: 'document',
        recordId: relationship.renter_id,
        data: {
          type: 'document',
          document_id: document.id,
          document_type: document.document_type,
          renter_id: relationship.renter_id,
          relationship_id: document.relationship_id,
          file_name: document.file_name,
          deep_link_url: `/connections?showDocuments=true&documentId=${document.id}&renterId=${relationship.renter_id}`
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
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});