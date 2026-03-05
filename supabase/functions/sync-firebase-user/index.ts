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

// Deterministic password from firebase_uid using HMAC-SHA256
async function getDeterministicPassword(firebaseUid: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(firebaseUid));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    const password = await getDeterministicPassword(firebase_uid, serviceRoleKey);

    console.log("Syncing user:", { firebase_uid, phone_number, email, has_fcm_token: !!fcm_token });

    let supabaseUserId: string | null = null;
    let finalEmail = email;

    // Strategy: Try sign-in first, then create if needed
    const { data: signInData, error: signInErr } =
      await publicClient.auth.signInWithPassword({ email, password });

    if (signInData?.session) {
      // User exists and password matches — already synced before
      supabaseUserId = signInData.session.user.id;
      finalEmail = signInData.session.user.email || email;
      console.log("Signed in existing user:", supabaseUserId);
    } else {
      console.log("Sign-in failed, looking up or creating user. Reason:", signInErr?.message);

      // Try to find user by email first
      let existingUser = null;
      try {
        const { data: byEmail } = await admin.auth.admin.getUserByEmail(email);
        if (byEmail?.user) existingUser = byEmail.user;
      } catch (_) { /* not found */ }

      // If not found by email, try by phone (getUserByPhone not available, search via listUsers pages)
      if (!existingUser) {
        let page = 1;
        const perPage = 1000;
        let found = false;
        while (!found) {
          const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
          if (listErr || !list?.users?.length) break;
          const match = list.users.find((u: { phone?: string }) => u.phone === phone_number);
          if (match) {
            existingUser = match;
            found = true;
          }
          if (list.users.length < perPage) break;
          page++;
        }
      }

      if (existingUser) {
        supabaseUserId = existingUser.id;
        finalEmail = existingUser.email || email;

        // Update password to deterministic one and sync metadata
        const { error: updErr } = await admin.auth.admin.updateUserById(existingUser.id, {
          email: finalEmail,
          email_confirm: true,
          phone_confirm: true,
          password,
          user_metadata: {
            ...(existingUser.user_metadata || {}),
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
        // Create new user
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          phone: phone_number,
          email,
          password,
          phone_confirm: true,
          email_confirm: true,
          user_metadata: { firebase_uid, phone: phone_number },
        });

        if (createErr) {
          console.error("createUser error:", createErr);
          return new Response(
            JSON.stringify({ error: "Failed to create user", details: createErr.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        supabaseUserId = created.user.id;
        finalEmail = email;
        console.log("Created new user:", supabaseUserId);
      }

      // Now sign in with the deterministic password to get session tokens
      const { data: newSignIn, error: newSignInErr } =
        await publicClient.auth.signInWithPassword({ email: finalEmail, password });

      if (newSignInErr || !newSignIn?.session) {
        console.error("signInWithPassword error:", newSignInErr);
        return new Response(
          JSON.stringify({ error: "Failed to create session", details: newSignInErr?.message || "signInWithPassword failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Reassign so we use this session below
      Object.assign(signInData || {}, newSignIn);
    }

    const session = signInData?.session;

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
    }

    // Save FCM token
    if (fcm_token && supabaseUserId) {
      try {
        const { error: fcmErr } = await admin.rpc("upsert_fcm_token_safe", {
          p_user_id: supabaseUserId,
          p_token: fcm_token,
        });
        if (fcmErr) {
          const { error: fallbackErr } = await admin
            .from("fcm_tokens")
            .upsert([{ user_id: supabaseUserId, token: fcm_token, created_at: new Date().toISOString() }], { onConflict: "user_id", ignoreDuplicates: false });
          if (fallbackErr) console.error("Fallback FCM upsert failed:", fallbackErr);
        }
      } catch (error) {
        console.error("Exception saving FCM token:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_token: session?.access_token,
        refresh_token: session?.refresh_token,
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
