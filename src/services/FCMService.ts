import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FCMToken {
  id: string;
  user_id: string;
  token: string;
  device_id: string;
  created_at: string;
}

// Temporary storage for FCM token before user login (with localStorage persistence)
let pendingFCMToken: string | null = null;

/**
 * Gets or generates a unique device ID for this device
 */
const getDeviceId = (): string => {
  try {
    let deviceId = localStorage.getItem('fcm_device_id');
    if (!deviceId) {
      // Generate a new UUID for this device
      deviceId = crypto.randomUUID();
      localStorage.setItem('fcm_device_id', deviceId);
      console.log("📱 Generated new device ID:", deviceId);
    }
    return deviceId;
  } catch (error) {
    console.warn("Could not access localStorage for device ID, using session UUID:", error);
    return crypto.randomUUID();
  }
};

/**
 * Gets pending token from memory or localStorage
 */
const getPendingFCMToken = (): string | null => {
  if (pendingFCMToken) return pendingFCMToken;
  
  // Check localStorage for persistent token (useful for app reinstalls)
  try {
    const stored = localStorage.getItem('fcm_pending_token');
    if (stored) {
      pendingFCMToken = stored;
      return stored;
    }
  } catch (error) {
    console.warn("Could not access localStorage for FCM token:", error);
  }
  
  return null;
};

/**
 * Stores FCM token temporarily with persistence across app restarts
 */
export const storePendingFCMToken = (token: string): void => {
  if (!token || token.trim() === '') {
    console.warn("❌ Invalid token provided to storePendingFCMToken");
    return;
  }
  
  console.log("🔥 New FCM Token generated:", token.substring(0, 20) + '...');
  pendingFCMToken = token;
  
  // Also store in localStorage for persistence across app restarts
  try {
    localStorage.setItem('fcm_pending_token', token);
    localStorage.setItem('fcm_pending_token_timestamp', Date.now().toString());
    console.log("📦 Token stored temporarily (memory + localStorage) until user login");
  } catch (error) {
    console.warn("Could not store FCM token in localStorage:", error);
    console.log("📦 Token stored temporarily (memory only) until user login");
  }
};

  /**
   * Registers FCM token for the current user using safe database function
   */
  export const registerFCMToken = async (token: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("📦 No authenticated user - storing token temporarily");
        storePendingFCMToken(token);
        return false;
      }

      if (!token || token.trim() === '') {
        console.warn("❌ Invalid FCM token provided");
        return false;
      }

      // Check if the existing token is the same
      const { data: existingTokens, error: fetchError } = await supabase
        .from('fcm_tokens')
        .select('token')
        .eq('user_id', user.id)
        .limit(1);

      if (fetchError) {
        console.warn("⚠️ Error fetching existing token:", fetchError.message);
        // Continue with save attempt even if fetch fails
      } else if (existingTokens && existingTokens.length > 0) {
        const existingToken = existingTokens[0].token;
        if (existingToken === token) {
          console.log("✅ Token already exists and is the same, skipping save");
          return true;
        }
        console.log("🔄 Token is different, will update");
      }

      console.log("🔥 Registering FCM token for user:", user.id);

      // Get device ID
      const deviceId = getDeviceId();
      console.log("📱 Using device ID:", deviceId);

      // Use direct insert with upsert since RPC function might not exist yet
      const { error: insertError } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          device_id: deviceId,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'device_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error("❌ Failed to register FCM token:", insertError);
        return false;
      }

      console.log("✅ Token registered successfully:", {
        user_id: user.id,
        device_id: deviceId,
        token: token.substring(0, 20) + '...'
      });

      // Also update user_profiles.fcm_token for backward compatibility
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ fcm_token: token } as any)
        .eq('id', user.id);

      if (profileError) {
        console.warn("⚠️ Error updating FCM token in user_profiles:", profileError.message);
        // Don't fail here since the main token is saved in fcm_tokens
      }

      // Clear pending token since we've successfully saved it
      pendingFCMToken = null;
      return true;
    } catch (error) {
      console.error("💥 Exception registering FCM token:", error);
      return false;
    }
  };

/**
 * Registers any pending FCM token after user login
 */
export const registerPendingFCMToken = async (): Promise<boolean> => {
  const token = getPendingFCMToken();
  
  if (!token) {
    console.log("📭 No pending FCM token to register");
    return true; // No pending token
  }

  // Check if token is not too old (24 hours max)
  try {
    const timestamp = localStorage.getItem('fcm_pending_token_timestamp');
    if (timestamp && (Date.now() - parseInt(timestamp)) > 24 * 60 * 60 * 1000) {
      console.log("🕒 Pending FCM token is too old, discarding");
      clearPendingFCMToken();
      return true;
    }
  } catch (error) {
    console.warn("Could not check token timestamp:", error);
  }

  console.log("📤 Registering pending FCM token after login:", token.substring(0, 20) + '...');
  const success = await registerFCMToken(token);
  
  if (success) {
    clearPendingFCMToken();
  }
  
  return success;
};

/**
 * Clears pending FCM token from memory and storage
 */
export const clearPendingFCMToken = (): void => {
  pendingFCMToken = null;
  try {
    localStorage.removeItem('fcm_pending_token');
    localStorage.removeItem('fcm_pending_token_timestamp');
    console.log("🧹 Cleared pending FCM token from storage");
  } catch (error) {
    console.warn("Could not clear FCM token from localStorage:", error);
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