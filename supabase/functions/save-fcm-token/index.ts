import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    // Parse request body
    const { user_id, token, device_id } = await req.json();

    // Validate required fields
    if (!user_id || !token || !device_id) {
      console.error('Missing required fields:', { user_id: !!user_id, token: !!token, device_id: !!device_id });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, token, and device_id are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate token length
    if (token.length < 10) {
      console.error('Invalid token length:', token.length);
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    console.log('Saving FCM token for user:', user_id, 'device:', device_id);

    // Upsert the FCM token using device_id as unique key
    const { data, error } = await supabase
      .from('fcm_tokens')
      .upsert({
        user_id,
        token,
        device_id,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'device_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database error saving FCM token:', error);
      return new Response(
        JSON.stringify({ error: `Failed to save FCM token: ${error.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ FCM token saved successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Exception in save-fcm-token function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
