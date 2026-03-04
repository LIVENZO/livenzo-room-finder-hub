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

/**
 * Find an existing user by phone number or email across ALL pages.
 * Returns the user object or null.
 */
async function findExistingUser(
  admin: ReturnType<typeof createClient>,
  phone: string,
  email: string
) {
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find(
      (u: { phone?: string; email?: string }) =>
        u.phone === phone || u.email === email
    );
    if (match) return match;
    if (data.users.length < perPage) break; // last page
    page++;
  }
  return null;
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
        JSON.stringify({ error: "firebase_uid and phone_number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = `${phone_number.replace("+", "")}@livenzo.app`;
    const tempPassword = generateTempPassword();

    console.log("Syncing user:", { firebase_uid, phone_number, email, has_fcm_token: !!fcm_token });

    // ── Step 1: Find existing user (paginated search) ──
    let existing: any = null;
    try {
      existing = await findExistingUser(admin, phone_number, email);
    } catch (err) {
      console.error("findExistingUser error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to check users", details: String(err) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let supabaseUserId: string | null = null;
    let finalEmail = email;

    if (existing) {
      // ── Step 2a: Update existing user ──
      supabaseUserId = existing.id;
      finalEmail = existing.email || email;

      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        email: finalEmail,
        email_confirm: true,
        phone_confirm: true,
        password: tempPassword,
        user_metadata: {
          ...(existing.user_metadata || {}),
          firebase_uid,
          phone: phone_number,
        },
      });

      if (updErr) {
        console.error("updateUserById error:", updErr);
        return new Response(
          JSON.stringify({ error: "Failed to update user", details: updErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Updated existing user:", supabaseUserId);
    } else {
      // ── Step 2b: Create new user, with phone_exists fallback ──
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        phone: phone_number,
        email,
        password: tempPassword,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: { firebase_uid, phone: phone_number },
      });

      if (createErr) {
        // Handle "phone_exists" or "email_exists" race condition
        const errMsg = createErr.message?.toLowerCase() || "";
        if (errMsg.includes("phone") || errMsg.includes("email") || errMsg.includes("already")) {
          console.log("Create failed with conflict, retrying lookup...");
          // Re-search to find the conflicting user
          try {
            existing = await findExistingUser(admin, phone_number, email);
          } catch (_) { /* ignore */ }

          if (existing) {
            supabaseUserId = existing.id;
            finalEmail = existing.email || email;

            const { error: updErr2 } = await admin.auth.admin.updateUserById(existing.id, {
              email: finalEmail,
              email_confirm: true,
              phone_confirm: true,
              password: tempPassword,
              user_metadata: {
                ...(existing.user_metadata || {}),
                firebase_uid,
                phone: phone_number,
              },
            });

            if (updErr2) {
              console.error("Fallback updateUserById error:", updErr2);
              return new Response(
                JSON.stringify({ error: "Failed to update user", details: updErr2.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            console.log("Updated user via fallback:", supabaseUserId);
          } else {
            console.error("createUser conflict but user not found on retry:", createErr);
            return new Response(
              JSON.stringify({ error: "Failed to create user", details: createErr.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          console.error("createUser error:", createErr);
          return new Response(
            JSON.stringify({ error: "Failed to create user", details: createErr.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        supabaseUserId = created.user.id;
        finalEmail = email;
        console.log("Created new user:", supabaseUserId);
      }
    }

    // ── Step 3: Upsert user_profiles ──
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
      // Non-fatal: continue to session creation
    }

    // ── Step 4: Save FCM token ──
    if (fcm_token && supabaseUserId) {
      try {
        const { error: fcmErr } = await admin.rpc("upsert_fcm_token_safe", {
          p_user_id: supabaseUserId,
          p_token: fcm_token,
        });
        if (fcmErr) {
          const { error: fallbackErr } = await admin
            .from("fcm_tokens")
            .upsert(
              [{ user_id: supabaseUserId, token: fcm_token, created_at: new Date().toISOString() }],
              { onConflict: "user_id", ignoreDuplicates: false }
            );
          if (fallbackErr) console.error("Fallback FCM upsert failed:", fallbackErr);
        }
      } catch (error) {
        console.error("Exception saving FCM token:", error);
      }
    }

    // ── Step 5: Create session ──
    console.log("Creating session for:", finalEmail);
    const { data: signInData, error: signInErr } =
      await publicClient.auth.signInWithPassword({
        email: finalEmail,
        password: tempPassword,
      });

    if (signInErr || !signInData?.session) {
      console.error("signInWithPassword error:", signInErr);
      return new Response(
        JSON.stringify({ error: "Failed to create session", details: signInErr?.message || "signInWithPassword failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        user_id: supabaseUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync user error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
