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

/**
 * Generate a deterministic password from firebase_uid + a secret.
 * This ensures the same user always gets the same password,
 * so we don't need to update it on every login.
 */
async function generateDeterministicPassword(
  firebaseUid: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(firebaseUid)
  );
  const hashArray = Array.from(new Uint8Array(signature));
  // Convert to base64url for a safe password string
  const base64 = btoa(String.fromCharCode(...hashArray));
  return "Lv!" + base64.replace(/\+/g, "-").replace(/\//g, "_").slice(0, 40);
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
    // Deterministic password: same firebase_uid always produces the same password
    const password = await generateDeterministicPassword(firebase_uid, serviceRoleKey);

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

      // For existing users: only update metadata, do NOT change the password
      // unless this is the first time we're setting the deterministic password.
      // We try signing in first; if it fails, we update the password.
      console.log("Found existing user:", supabaseUserId);

      // Update metadata only (no password change)
      const { error: updErr } = await admin.auth.admin.updateUserById(
        existing.id,
        {
          email: finalEmail,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            ...(existing.user_metadata || {}),
            firebase_uid,
            phone: phone_number,
          },
        }
      );

      if (updErr) {
        console.error("updateUserById metadata error:", updErr);
        // Non-fatal, continue to try sign-in
      }

      // Try signing in with deterministic password
      const { data: signInData, error: signInErr } =
        await publicClient.auth.signInWithPassword({
          email: finalEmail,
          password,
        });

      if (signInData?.session) {
        console.log("Existing user signed in successfully");
        // Save FCM token and profile in background
        await syncProfileAndFcm(admin, supabaseUserId!, firebase_uid, phone_number, fcm_token);

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
      }

      // Sign-in failed — likely old user with random password. Update to deterministic password.
      console.log("Sign-in failed for existing user, resetting password to deterministic:", signInErr?.message);
      const { error: pwdErr } = await admin.auth.admin.updateUserById(
        existing.id,
        { password }
      );

      if (pwdErr) {
        console.error("Password reset error:", pwdErr);
        return new Response(
          JSON.stringify({
            error: "Failed to reset user credentials",
            details: pwdErr.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // New user: create with deterministic password
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
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

    // Sync profile and FCM token
    await syncProfileAndFcm(admin, supabaseUserId!, firebase_uid, phone_number, fcm_token);

    // Create session via sign-in
    console.log("Creating session for:", finalEmail);
    const { data: signInData, error: signInErr } =
      await publicClient.auth.signInWithPassword({
        email: finalEmail,
        password,
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

/**
 * Helper: upsert user_profiles and save FCM token
 */
async function syncProfileAndFcm(
  admin: ReturnType<typeof createClient>,
  userId: string,
  firebaseUid: string,
  phoneNumber: string,
  fcmToken?: string | null
) {
  // Upsert user_profiles
  const profilePayload: Record<string, unknown> = {
    id: userId,
    firebase_uid: firebaseUid,
    phone: phoneNumber,
    updated_at: new Date().toISOString(),
  };
  if (fcmToken) profilePayload.fcm_token = fcmToken;

  const { error: profileErr } = await admin
    .from("user_profiles")
    .upsert(profilePayload, { onConflict: "id", ignoreDuplicates: false })
    .select()
    .maybeSingle();

  if (profileErr) {
    console.error("user_profiles upsert error:", profileErr);
  }

  // Save FCM token
  if (fcmToken) {
    console.log("Saving FCM token for user:", userId);
    try {
      const { error: fcmErr } = await admin.rpc("upsert_fcm_token_safe", {
        p_user_id: userId,
        p_token: fcmToken,
      });

      if (fcmErr) {
        console.error("FCM RPC failed, trying fallback:", fcmErr.message);
        const { error: fallbackErr } = await admin
          .from("fcm_tokens")
          .upsert(
            [
              {
                user_id: userId,
                token: fcmToken,
                created_at: new Date().toISOString(),
              },
            ],
            { onConflict: "user_id", ignoreDuplicates: false }
          );
        if (fallbackErr) {
          console.error("Fallback FCM upsert failed:", fallbackErr);
        }
      }
    } catch (error) {
      console.error("Exception saving FCM token:", error);
    }
  }
}
