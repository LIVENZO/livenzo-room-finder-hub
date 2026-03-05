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

    const body: SyncUserRequest = await req.json();
    const { firebase_uid, phone_number, fcm_token } = body;

    if (!firebase_uid || !phone_number) {
      return new Response(
        JSON.stringify({ error: "firebase_uid and phone_number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = `${phone_number.replace(/\+/g, "")}@livenzo.app`;
    const password = await generateDeterministicPassword(firebase_uid, serviceRoleKey);

    console.log("sync-firebase-user:", { firebase_uid, phone_number, email });

    // ─── Step 1: Check if user already exists ───
    // First check our mapping table (fast, no auth API call)
    let supabaseUserId: string | null = null;

    const { data: mapping } = await admin
      .from("firebase_user_mappings")
      .select("supabase_user_id")
      .eq("firebase_uid", firebase_uid)
      .maybeSingle();

    if (mapping?.supabase_user_id) {
      supabaseUserId = mapping.supabase_user_id;
      console.log("Found user via mapping table:", supabaseUserId);
    }

    // If no mapping, try getUserByEmail (efficient single-user lookup, no listUsers)
    if (!supabaseUserId) {
      try {
        const { data: existingUser } = await admin.auth.admin.getUserByEmail(email);
        if (existingUser?.user) {
          supabaseUserId = existingUser.user.id;
          console.log("Found user via email lookup:", supabaseUserId);
        }
      } catch (_e) {
        // getUserByEmail throws if user not found — that's fine, means new user
        console.log("No existing user found by email, will create new user");
      }
    }

    // ─── Step 2: Handle existing vs new user ───
    if (supabaseUserId) {
      // EXISTING USER: Try to sign in with deterministic password
      console.log("Existing user flow for:", supabaseUserId);

      // Try sign-in first (most common case for returning users)
      const signInClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: signInData, error: signInErr } =
        await signInClient.auth.signInWithPassword({ email, password });

      if (signInData?.session) {
        console.log("Existing user signed in successfully");
        // Background: sync profile, mapping, FCM
        await syncAll(admin, supabaseUserId, firebase_uid, phone_number, fcm_token);
        return jsonResponse(200, {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          user_id: supabaseUserId,
        });
      }

      // Sign-in failed — legacy user with old random password
      // Update password to deterministic and retry
      console.log("Sign-in failed, migrating password:", signInErr?.message);

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
        return jsonResponse(500, { error: "Failed to migrate user credentials", details: pwdErr.message });
      }

      // Small delay to let auth state propagate
      await new Promise((r) => setTimeout(r, 300));

      // Retry sign-in after password update
      const signInClient2 = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: retryData, error: retryErr } =
        await signInClient2.auth.signInWithPassword({ email, password });

      if (!retryData?.session) {
        console.error("Retry sign-in failed:", retryErr);
        return jsonResponse(500, {
          error: "Failed to create session after password migration",
          details: retryErr?.message || "Unknown error",
        });
      }

      console.log("Existing user signed in after password migration");
      await syncAll(admin, supabaseUserId, firebase_uid, phone_number, fcm_token);
      return jsonResponse(200, {
        access_token: retryData.session.access_token,
        refresh_token: retryData.session.refresh_token,
        user_id: supabaseUserId,
      });

    } else {
      // NEW USER: Create with deterministic password
      console.log("New user flow — creating user");

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
        // Handle edge case: user was created between our check and create call
        if (createErr.message?.includes("already been registered") ||
            createErr.message?.includes("already exists")) {
          console.log("User was created concurrently, retrying as existing user");
          // Retry as existing user
          try {
            const { data: raceUser } = await admin.auth.admin.getUserByEmail(email);
            if (raceUser?.user) {
              supabaseUserId = raceUser.user.id;

              // Update password to our deterministic one
              await admin.auth.admin.updateUserById(supabaseUserId, { password });
              await new Promise((r) => setTimeout(r, 300));

              const raceClient = createClient(supabaseUrl, anonKey, {
                auth: { autoRefreshToken: false, persistSession: false },
              });
              const { data: raceSign } = await raceClient.auth.signInWithPassword({ email, password });

              if (raceSign?.session) {
                await syncAll(admin, supabaseUserId, firebase_uid, phone_number, fcm_token);
                return jsonResponse(200, {
                  access_token: raceSign.session.access_token,
                  refresh_token: raceSign.session.refresh_token,
                  user_id: supabaseUserId,
                });
              }
            }
          } catch (_raceErr) {
            // fall through to error
          }
          return jsonResponse(500, { error: "Failed to create user (race condition)", details: createErr.message });
        }

        console.error("createUser error:", createErr);
        return jsonResponse(500, { error: "Failed to create user", details: createErr.message });
      }

      supabaseUserId = created.user.id;
      console.log("Created new user:", supabaseUserId);

      // Sync profile, mapping, FCM
      await syncAll(admin, supabaseUserId, firebase_uid, phone_number, fcm_token);

      // Small delay before sign-in for new user
      await new Promise((r) => setTimeout(r, 200));

      // Sign in to create session
      const newClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: newSignIn, error: newSignErr } =
        await newClient.auth.signInWithPassword({ email, password });

      if (!newSignIn?.session) {
        console.error("New user sign-in failed:", newSignErr);
        return jsonResponse(500, {
          error: "Failed to create session for new user",
          details: newSignErr?.message || "Unknown error",
        });
      }

      console.log("New user session created successfully");
      return jsonResponse(200, {
        access_token: newSignIn.session.access_token,
        refresh_token: newSignIn.session.refresh_token,
        user_id: supabaseUserId,
      });
    }
  } catch (error) {
    console.error("sync-firebase-user unhandled error:", error);
    return jsonResponse(500, { error: "Internal server error" });
  }
});

/** JSON response helper */
function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Sync profile, firebase mapping, and FCM token (best-effort, non-blocking errors)
 */
async function syncAll(
  admin: ReturnType<typeof createClient>,
  userId: string,
  firebaseUid: string,
  phoneNumber: string,
  fcmToken?: string | null
) {
  // 1. Upsert firebase_user_mappings
  const { error: mapErr } = await admin
    .from("firebase_user_mappings")
    .upsert(
      {
        firebase_uid: firebaseUid,
        supabase_user_id: userId,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "firebase_uid" }
    );
  if (mapErr) console.error("firebase_user_mappings upsert error:", mapErr);

  // 2. Upsert user_profiles
  const { error: profileErr } = await admin
    .from("user_profiles")
    .upsert(
      {
        id: userId,
        firebase_uid: firebaseUid,
        phone: phoneNumber,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false }
    );
  if (profileErr) console.error("user_profiles upsert error:", profileErr);

  // 3. Save FCM token
  if (fcmToken) {
    const { error: fcmErr } = await admin
      .from("fcm_tokens")
      .upsert(
        { user_id: userId, token: fcmToken, created_at: new Date().toISOString() },
        { onConflict: "user_id", ignoreDuplicates: false }
      );
    if (fcmErr) console.error("FCM token upsert error:", fcmErr);
  }
}
