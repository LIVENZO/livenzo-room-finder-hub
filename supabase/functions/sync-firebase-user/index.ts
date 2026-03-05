import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SyncUserRequest {
  firebase_uid: string;
  phone_number: string;
  fcm_token?: string | null;
}

/**
 * Generate a deterministic password from firebase_uid + a secret.
 * Same firebase_uid always produces the same password.
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
  const base64 = btoa(String.fromCharCode(...hashArray));
  return "Lv!" + base64.replace(/\+/g, "-").replace(/\//g, "_").slice(0, 40);
}

/** JSON response helper */
function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Try to sign in with email/password. Returns session or null.
 */
async function trySignIn(
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string
): Promise<{ access_token: string; refresh_token: string } | null> {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (data?.session) {
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }
  if (error) console.log("trySignIn failed:", error.message);
  return null;
}

/**
 * Sync profile, firebase mapping, and FCM token (best-effort)
 */
async function syncAll(
  admin: ReturnType<typeof createClient>,
  userId: string,
  firebaseUid: string,
  phoneNumber: string,
  fcmToken?: string | null
) {
  const promises: Promise<unknown>[] = [];

  // 1. Upsert firebase_user_mappings
  promises.push(
    admin
      .from("firebase_user_mappings")
      .upsert(
        {
          firebase_uid: firebaseUid,
          supabase_user_id: userId,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "firebase_uid" }
      )
      .then(({ error }) => {
        if (error) console.error("firebase_user_mappings upsert error:", error);
      })
  );

  // 2. Upsert user_profiles
  promises.push(
    admin
      .from("user_profiles")
      .upsert(
        {
          id: userId,
          firebase_uid: firebaseUid,
          phone: phoneNumber,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id", ignoreDuplicates: false }
      )
      .then(({ error }) => {
        if (error) console.error("user_profiles upsert error:", error);
      })
  );

  // 3. Save FCM token
  if (fcmToken) {
    promises.push(
      admin
        .from("fcm_tokens")
        .upsert(
          { user_id: userId, token: fcmToken, created_at: new Date().toISOString() },
          { onConflict: "user_id", ignoreDuplicates: false }
        )
        .then(({ error }) => {
          if (error) console.error("FCM token upsert error:", error);
        })
    );
  }

  await Promise.allSettled(promises);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body: SyncUserRequest = await req.json();
    const { firebase_uid, phone_number, fcm_token } = body;

    if (!firebase_uid || !phone_number) {
      return jsonResponse(400, { error: "firebase_uid and phone_number are required" });
    }

    const email = `${phone_number.replace(/\+/g, "")}@livenzo.app`;
    const password = await generateDeterministicPassword(firebase_uid, serviceRoleKey);

    console.log("sync-firebase-user:", { firebase_uid, phone_number, email });

    // ─── Strategy: Try sign-in FIRST, then create if needed ───
    // This avoids the "user already exists" error entirely for returning users.

    // Step 1: Try to sign in directly (fastest path for returning users)
    const quickSession = await trySignIn(supabaseUrl, anonKey, email, password);
    if (quickSession) {
      console.log("Existing user signed in successfully (fast path)");
      // Look up user_id from mapping or session
      let userId: string | null = null;
      const { data: mapping } = await admin
        .from("firebase_user_mappings")
        .select("supabase_user_id")
        .eq("firebase_uid", firebase_uid)
        .maybeSingle();
      userId = mapping?.supabase_user_id || null;

      if (!userId) {
        // Decode from the access token
        try {
          const payload = JSON.parse(atob(quickSession.access_token.split(".")[1]));
          userId = payload.sub;
        } catch (_) {
          // ignore
        }
      }

      if (userId) {
        // Background sync (don't block response)
        syncAll(admin, userId, firebase_uid, phone_number, fcm_token).catch((e) =>
          console.error("syncAll error:", e)
        );
      }

      return jsonResponse(200, {
        success: true,
        access_token: quickSession.access_token,
        refresh_token: quickSession.refresh_token,
        user_id: userId || "unknown",
      });
    }

    // Step 2: Sign-in failed. Check if user exists but has old/different password.
    console.log("Quick sign-in failed, checking if user exists...");

    let supabaseUserId: string | null = null;

    // Check mapping table first
    const { data: mappingData } = await admin
      .from("firebase_user_mappings")
      .select("supabase_user_id")
      .eq("firebase_uid", firebase_uid)
      .maybeSingle();

    if (mappingData?.supabase_user_id) {
      supabaseUserId = mappingData.supabase_user_id;
      console.log("Found user via mapping table:", supabaseUserId);
    }

    // Try getUserByEmail as fallback
    if (!supabaseUserId) {
      try {
        const { data: existingUser } = await admin.auth.admin.getUserByEmail(email);
        if (existingUser?.user) {
          supabaseUserId = existingUser.user.id;
          console.log("Found user via email lookup:", supabaseUserId);
        }
      } catch (_e) {
        console.log("No existing user found by email");
      }
    }

    if (supabaseUserId) {
      // ─── EXISTING USER with old password: migrate to deterministic password ───
      console.log("Migrating existing user password:", supabaseUserId);

      const { error: pwdErr } = await admin.auth.admin.updateUserById(
        supabaseUserId,
        {
          password,
          email,
          email_confirm: true,
          phone: phone_number,
          phone_confirm: true,
          user_metadata: { firebase_uid, phone: phone_number },
        }
      );

      if (pwdErr) {
        console.error("Password migration error:", pwdErr);
        return jsonResponse(500, {
          success: false,
          error: "Failed to migrate user credentials",
          details: pwdErr.message,
        });
      }

      // Small delay for auth state propagation
      await new Promise((r) => setTimeout(r, 500));

      // Retry sign-in
      const retrySession = await trySignIn(supabaseUrl, anonKey, email, password);
      if (!retrySession) {
        console.error("Sign-in failed after password migration");
        return jsonResponse(500, {
          success: false,
          error: "Failed to create session after password migration",
        });
      }

      console.log("Existing user signed in after password migration");
      syncAll(admin, supabaseUserId, firebase_uid, phone_number, fcm_token).catch((e) =>
        console.error("syncAll error:", e)
      );

      return jsonResponse(200, {
        success: true,
        access_token: retrySession.access_token,
        refresh_token: retrySession.refresh_token,
        user_id: supabaseUserId,
      });
    }

    // ─── Step 3: Truly NEW USER — create account ───
    console.log("Creating new user...");

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      phone: phone_number,
      email,
      password,
      phone_confirm: true,
      email_confirm: true,
      user_metadata: { firebase_uid, phone: phone_number },
    });

    if (createErr) {
      // Handle race condition: user created between our check and create
      if (
        createErr.message?.includes("already been registered") ||
        createErr.message?.includes("already exists")
      ) {
        console.log("Race condition: user created concurrently, retrying as existing user");

        // Try to find and sign in
        try {
          const { data: raceUser } = await admin.auth.admin.getUserByEmail(email);
          if (raceUser?.user) {
            await admin.auth.admin.updateUserById(raceUser.user.id, { password });
            await new Promise((r) => setTimeout(r, 500));

            const raceSession = await trySignIn(supabaseUrl, anonKey, email, password);
            if (raceSession) {
              syncAll(admin, raceUser.user.id, firebase_uid, phone_number, fcm_token).catch(
                (e) => console.error("syncAll error:", e)
              );
              return jsonResponse(200, {
                success: true,
                access_token: raceSession.access_token,
                refresh_token: raceSession.refresh_token,
                user_id: raceUser.user.id,
              });
            }
          }
        } catch (_raceErr) {
          console.error("Race condition recovery failed:", _raceErr);
        }

        return jsonResponse(500, {
          success: false,
          error: "Failed to create user (race condition)",
          details: createErr.message,
        });
      }

      console.error("createUser error:", createErr);
      return jsonResponse(500, { success: false, error: "Failed to create user", details: createErr.message });
    }

    supabaseUserId = created.user.id;
    console.log("Created new user:", supabaseUserId);

    // Sync profile, mapping, FCM
    await syncAll(admin, supabaseUserId, firebase_uid, phone_number, fcm_token);

    // Small delay before sign-in for new user
    await new Promise((r) => setTimeout(r, 300));

    // Sign in to create session
    const newSession = await trySignIn(supabaseUrl, anonKey, email, password);
    if (!newSession) {
      console.error("New user sign-in failed");
      return jsonResponse(500, {
        success: false,
        error: "Failed to create session for new user",
      });
    }

    console.log("New user session created successfully");
    return jsonResponse(200, {
      success: true,
      access_token: newSession.access_token,
      refresh_token: newSession.refresh_token,
      user_id: supabaseUserId,
    });
  } catch (error) {
    console.error("sync-firebase-user unhandled error:", error);
    return jsonResponse(500, { success: false, error: "Internal server error" });
  }
});
