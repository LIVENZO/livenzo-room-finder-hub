import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const configRaw = Deno.env.get("FIREBASE_CONFIG");
    if (!configRaw) {
      return new Response(JSON.stringify({ error: "FIREBASE_CONFIG not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The secret should contain the standard Firebase Web config JSON
    let config;
    try {
      config = JSON.parse(configRaw);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid FIREBASE_CONFIG JSON" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only return the fields required by the Web SDK
    const {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    } = config;

    return new Response(
      JSON.stringify({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("get-firebase-config error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
