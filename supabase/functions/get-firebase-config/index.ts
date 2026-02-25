import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const configRaw = Deno.env.get("FIREBASE_CONFIG");
    
    if (!configRaw || configRaw.trim() === "") {
      console.error("FIREBASE_CONFIG env var is missing or empty. Set it in Supabase Dashboard > Settings > Edge Functions > Secrets.");
      
      // Attempt individual fallback env vars
      const fallback = {
        apiKey: Deno.env.get("FIREBASE_WEB_API_KEY") || "",
        authDomain: `${Deno.env.get("GOOGLE_PROJECT_ID") || "unknown"}.firebaseapp.com`,
        projectId: Deno.env.get("GOOGLE_PROJECT_ID") || "",
        storageBucket: `${Deno.env.get("GOOGLE_PROJECT_ID") || "unknown"}.firebasestorage.app`,
        messagingSenderId: "",
        appId: "",
      };
      
      if (fallback.apiKey && fallback.projectId) {
        console.warn("Using fallback Firebase config from individual env vars");
        return new Response(JSON.stringify(fallback), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: "FIREBASE_CONFIG not set and fallback vars missing",
        hint: "Set FIREBASE_CONFIG secret in Supabase Dashboard > Settings > Edge Functions" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let config;
    try {
      config = JSON.parse(configRaw);
    } catch (e) {
      console.error("FIREBASE_CONFIG is not valid JSON:", configRaw.substring(0, 100));
      return new Response(JSON.stringify({ 
        error: "Invalid FIREBASE_CONFIG JSON",
        hint: "Ensure the secret value is a valid JSON object" 
      }), {
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
