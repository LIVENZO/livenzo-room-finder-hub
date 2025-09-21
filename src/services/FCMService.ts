import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FCMToken {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
}

// Temporary storage for FCM token before user login
let pendingFCMToken: string | null = null;

/**
 * Stores FCM token temporarily before user login
 */
export const storePendingFCMToken = (token: string): void => {
  console.log("🔥 New FCM Token generated:", token.substring(0, 20) + '...');
  pendingFCMToken = token;
  console.log("📦 Token stored temporarily until user login");
};

/**
 * Registers FCM token for the current user
 */
export const registerFCMToken = async (token: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("📦 Token stored temporarily until user login");
      // Store token temporarily for later registration
      storePendingFCMToken(token);
      return false;
    }

    console.log("🔥 Registering FCM token for user:", user.id);

    // Use upsert to handle token conflicts automatically - replaces existing token for this user
    const { data, error } = await supabase
      .from('fcm_tokens')
      .upsert([
        { user_id: user.id, token: token, created_at: new Date().toISOString() }
      ], { onConflict: 'user_id' });

    if (error) {
      console.error("❌ Failed to save FCM token:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        user_id: user.id,
        token_length: token.length
      });
      return false;
    } else {
      console.log("✅ Token saved/updated successfully:", {
        user_id: user.id,
        token: token.substring(0, 20) + '...'
      });
    }

    // Also update user_profiles.fcm_token for backward compatibility
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ fcm_token: token } as any)
      .eq('id', user.id);

    if (profileError) {
      console.warn("Error updating FCM token in user_profiles:", profileError);
      // Don't fail here since the main token is saved in fcm_tokens
    }

    // Clear pending token since we've successfully saved it
    pendingFCMToken = null;
    return true;
  } catch (error) {
    console.error("Exception registering FCM token:", error);
    return false;
  }
};

/**
 * Registers any pending FCM token after user login
 */
export const registerPendingFCMToken = async (): Promise<boolean> => {
  if (!pendingFCMToken) {
    return true; // No pending token
  }

  console.log("📤 Registering pending FCM token after login");
  const success = await registerFCMToken(pendingFCMToken);
  
  if (success) {
    pendingFCMToken = null; // Clear pending token
  }
  
  return success;
};

/**
 * Removes FCM token for the current user
 */
export const unregisterFCMToken = async (token: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }

    console.log("Unregistering FCM token for user:", user.id);

    const { error } = await supabase
      .from("fcm_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("token", token);

    if (error) {
      console.error("Error unregistering FCM token:", error);
      return false;
    }

    console.log("FCM token unregistered successfully");
    return true;
  } catch (error) {
    console.error("Exception unregistering FCM token:", error);
    return false;
  }
};

/**
 * Gets all FCM tokens for the current user
 */
export const getUserFCMTokens = async (): Promise<FCMToken[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return [];
    }

    const { data, error } = await supabase
      .from("fcm_tokens")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching FCM tokens:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception fetching FCM tokens:", error);
    return [];
  }
};

/**
 * Initialize FCM for web browsers
 */
export const initializeFCM = async (): Promise<string | null> => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment, skipping FCM initialization");
      return null;
    }

    // For web, we'd need Firebase SDK
    // This is a placeholder for browser FCM implementation
    console.log("FCM web initialization not implemented yet");
    return null;
  } catch (error) {
    console.error("Error initializing FCM:", error);
    return null;
  }
};