import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FCMToken {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
}

/**
 * Registers FCM token for the current user
 */
export const registerFCMToken = async (token: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }

    console.log("Registering FCM token for user:", user.id);

    // Use upsert to handle token conflicts automatically
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
      console.log("✅ FCM token saved or updated successfully:", {
        user_id: user.id,
        token_length: token.length,
        data
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

    console.log("FCM token registered successfully");
    return true;
  } catch (error) {
    console.error("Exception registering FCM token:", error);
    return false;
  }
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