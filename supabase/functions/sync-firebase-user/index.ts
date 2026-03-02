import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SyncUserRequest {
  firebase_uid: string;
  phone_number: string;
  fcm_token?: string | null;
}

function generateTempPassword(length = 32): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_!@#$%^&*()";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (v) => chars[v % chars.length]).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body: SyncUserRequest = await req.json();
    const { firebase_uid, phone_number, fcm_token } = body;

    if (!firebase_uid || !phone_number) {
      return new Response(
        JSON.stringify({
          error: "firebase_uid and phone_number are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const email = `${phone_number.replace("+", "")}@livenzo.app`;
    const tempPassword = generateTempPassword();

    console.log("Syncing user:", {
      firebase_uid,
      phone_number,
      email,
      has_fcm_token: !!fcm_token,
    });

    // Find existing user
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listErr) {
      console.error("listUsers error:", listErr);
      return new Response(
        JSON.stringify({
          error: "Failed to check users",
          details: listErr.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let supabaseUserId: string | null = null;
    let finalEmail = email;

    const existing = list.users.find(
      (u: { phone?: string; email?: string }) =>
        u.phone === phone_number || u.email === email
    );

    if (existing) {
      supabaseUserId = existing.id;
      finalEmail = existing.email || email;

      const { error: updErr } = await admin.auth.admin.updateUserById(
        existing.id,
        {
          email: finalEmail,
          email_confirm: true,
          phone_confirm: true,
          password: tempPassword,
          user_metadata: {
            ...(existing.user_metadata || {}),
            firebase_uid,
            phone: phone_number,
          },
        }
      );

      if (updErr) {
        console.error("updateUserById error:", updErr);
        return new Response(
          JSON.stringify({
            error: "Failed to update user",
            details: updErr.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.log("Updated existing user:", supabaseUserId);
    } else {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          phone: phone_number,
          email,
          password: tempPassword,
          phone_confirm: true,
          email_confirm: true,
          user_metadata: { firebase_uid, phone: phone_number },
        });

      if (createErr) {
        console.error("createUser error:", createErr);
        return new Response(
          JSON.stringify({
            error: "Failed to create user",
            details: createErr.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      supabaseUserId = created.user.id;
      finalEmail = email;
      console.log("Created new user:", supabaseUserId);
    }

    // Upsert user_profiles
    const profilePayload: Record<string, unknown> = {
      id: supabaseUserId,
      firebase_uid,
      phone: phone_number,
      updated_at: new Date().toISOString(),
    };
    if (fcm_token) profilePayload.fcm_token = fcm_token;

    const { error: profileErr } = await admin
      .from("user_profiles")
      .upsert(profilePayload, { onConflict: "id", ignoreDuplicates: false })
      .select()
      .maybeSingle();

    if (profileErr) {
      console.error("user_profiles upsert error:", profileErr);
      return new Response(
        JSON.stringify({
          error: "Failed to sync user profile",
          details: profileErr.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Save FCM token
    if (fcm_token && supabaseUserId) {
      console.log("Saving FCM token for user:", supabaseUserId);
      try {
        const { error: fcmErr } = await admin.rpc("upsert_fcm_token_safe", {
          p_user_id: supabaseUserId,
          p_token: fcm_token,
        });

        if (fcmErr) {
          console.error("FCM RPC failed, trying fallback:", fcmErr.message);
          const { error: fallbackErr } = await admin
            .from("fcm_tokens")
            .upsert(
              [
                {
                  user_id: supabaseUserId,
                  token: fcm_token,
                  created_at: new Date().toISOString(),
                },
              ],
              { onConflict: "user_id", ignoreDuplicates: false }
            );
          if (fallbackErr) {
            console.error("Fallback FCM upsert failed:", fallbackErr);
          } else {
            console.log("FCM token saved via fallback");
          }
        } else {
          console.log("FCM token saved via RPC");
        }
      } catch (error) {
        console.error("Exception saving FCM token:", error);
      }
    }

    // Create session
    console.log("Creating session for:", finalEmail);
    const { data: signInData, error: signInErr } =
      await publicClient.auth.signInWithPassword({
        email: finalEmail,
        password: tempPassword,
      });

    if (signInErr || !signInData?.session) {
      console.error("signInWithPassword error:", signInErr);
      return new Response(
        JSON.stringify({
          error: "Failed to create session",
          details: signInErr?.message || "signInWithPassword failed",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        user_id: supabaseUserId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync user error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
